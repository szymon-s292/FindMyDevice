package com.example.find.services

import android.content.Context
import android.nfc.Tag
import android.util.Log
import androidx.compose.ui.platform.LocalContext
import com.example.find.AppConfiguration
import com.example.find.misc.ApiModels
import com.example.find.misc.AuthState
import com.example.find.misc.TokenAuthenticator
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.FirebaseMessagingService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.Authenticator
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.Route

class AuthService(private val context: Context) {
    val tokenService: TokenService by lazy { TokenService(context) }
    private val _authState = MutableStateFlow<AuthState>(AuthState.Checking)
    val authState = _authState.asStateFlow()

    private val json = Json {
        ignoreUnknownKeys = true
        prettyPrint = false
    }
    private val client = OkHttpClient.Builder()
        .retryOnConnectionFailure(true)
        .authenticator(TokenAuthenticator { refreshToken() })
        .build()
    private val baseUrl = AppConfiguration.baseUrl
    suspend fun login(email: String, password: String): Result<ApiModels.LoginResponse> =
        withContext(Dispatchers.IO) {
            try {
                val requestBody = json.encodeToString(ApiModels.LoginRequest(email, password))
                    .toRequestBody("application/json".toMediaType())

                val request = Request.Builder()
                    .url("$baseUrl/auth/login")
                    .post(requestBody)
                    .build()

                client.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        val errorMessage = when (response.code) {
                            400 -> "Check your email or password format."
                            401 -> "Incorrect email or password."
                            500 -> "Server error — please try again later."
                            else -> "Unexpected error: HTTP ${response.code}"
                        }
                        return@withContext Result.failure(Exception(errorMessage))
                    }

                    val body = response.body?.string() ?: ""
                    val loginResponse = json.decodeFromString<ApiModels.LoginResponse>(body)
                    tokenService.saveAccessToken(loginResponse.accessToken)
                    tokenService.saveRefreshToken(loginResponse.refreshToken)
                    _authState.value = AuthState.Authenticated

                    return@withContext Result.success(loginResponse)
                }
            } catch (e: Exception) {
                return@withContext Result.failure(e)
            }
        }
    suspend fun logout(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val accessToken = tokenService.getAccessToken()
            if (accessToken == null)
                return@withContext Result.failure(Exception("Access token is null"))

            val request = Request.Builder()
                .url("$baseUrl/auth/logout")
                .header("Authorization", "Bearer $accessToken")
                .post("".toRequestBody())
                .build()

            client.newCall(request).execute().use { response ->
                if(!response.isSuccessful){
                    val errorMessage = when(response.code) {
                        500 -> "Server error — please try again later."
                        else -> "Unexpected error: HTTP ${response.code}"
                    }
                    return@withContext Result.failure(Exception(errorMessage))
                }
            }

            val identificationService = IdentificationService(context, this@AuthService)
            identificationService.deleteIdentifier()
            Log.d("Logout", identificationService.getIdentifier().toString())

            tokenService.clearTokens()
            _authState.value = AuthState.Unauthenticated

            FirebaseMessaging.getInstance().deleteToken()
            return@withContext Result.success(Unit)
        } catch (e: Exception) {
            return@withContext Result.failure(e)
        }
    }
    suspend fun refreshToken(): Result<ApiModels.RefreshResponse> = withContext(Dispatchers.IO) {
        try {
            val refreshToken = tokenService.getRefreshToken()
            if (refreshToken == null)
                return@withContext Result.failure(Exception("Refresh token is null"))

            val request = Request.Builder()
                .url("$baseUrl/auth/refresh")
                .header("Authorization", "Bearer $refreshToken")
                .post("".toRequestBody())
                .build()

            client.newCall(request).execute().use { response ->
                return@withContext if (response.isSuccessful) {
                    val body = response.body?.string() ?: ""
                    if (body == "")
                        return@withContext Result.failure(Exception("Empty response"))
                    Log.d(TAG, body)
                    val refreshTokenResponse =
                        json.decodeFromString<ApiModels.RefreshResponse>(body)
                    tokenService.saveAccessToken(refreshTokenResponse.accessToken)
                    Result.success(refreshTokenResponse)
                } else {
                    Result.failure(Exception(response.code.toString()))
                }
            }
        } catch (e: Exception) {
            return@withContext Result.failure(e)
        }
    }
    private suspend fun protected(): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val accessToken = tokenService.getAccessToken()
            if (accessToken == null)
                return@withContext Result.failure(Exception("Access token is null"))

            val request = Request.Builder()
                .url("$baseUrl/protected")
                .header("Authorization", "Bearer $accessToken")
                .get()
                .build()

            client.newCall(request).execute().use { response ->
                return@withContext if (response.isSuccessful) {
                    Result.success(true)
                } else {
                    val errorMessage = when(response.code) {
                        500 -> "Server error — please try again later."
                        else -> "Unexpected error: HTTP ${response.code}"
                    }
                    return@withContext Result.failure(Exception(errorMessage))
                }
            }
        } catch (e: Exception) {
            return@withContext Result.failure(e)
        }
    }
    suspend fun check(): Result<Unit> = withContext(Dispatchers.IO) {
        _authState.value = AuthState.Checking
        Log.d(TAG, "Checking authentication state...")

        val result = protected()
        result.onSuccess {
            Log.d(TAG, "Current access token works")
            _authState.value = AuthState.Authenticated
            return@withContext Result.success(Unit)
        }
        result.onFailure { error ->
            Log.d(TAG, "Access token doesn't work")
        }

        Log.d(TAG, "Refreshing access token")
        val refreshTokenResponse = refreshToken()
        refreshTokenResponse.onSuccess { response ->
            Log.d(TAG, "Refresh succeeded")
            _authState.value = AuthState.Authenticated
            tokenService.saveAccessToken(response.accessToken)
            return@withContext Result.success(Unit)
        }
        refreshTokenResponse.onFailure { error ->
            Log.d(TAG, "Refresh failed")
            _authState.value = AuthState.Unauthenticated
//            tokenService.clearTokens()
            return@withContext Result.failure(error)
        }

        return@withContext Result.success(Unit)
    }

    suspend fun submitRegistrationToken(token: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val json = """{"fcmToken": "$token"}"""
            val mediaType = "application/json; charset=utf-8".toMediaType()
            val body = json.toRequestBody(mediaType)
            val accessToken = tokenService.getAccessToken()

            if (accessToken == null)
                return@withContext Result.failure(Exception("Access token is null"))

            val request = Request.Builder()
                .url("$baseUrl/fcm/registration")
                .post(body)
                .header("Authorization", "Bearer $accessToken")
                .build()

            client.newCall(request).execute().use { response ->
                return@withContext if (response.isSuccessful) {
                    Result.success(Unit)
                } else {
                    Result.failure(Exception(response.code.toString()))
                }
            }
        } catch (e: Exception) {
            Result.failure(Exception(e.message.toString()))
        }
    }
    companion object {
        private const val TAG = "AuthService"
    }
}