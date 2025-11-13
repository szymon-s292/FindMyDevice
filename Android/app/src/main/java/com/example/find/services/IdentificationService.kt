package com.example.find.services

import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import android.os.Looper
import android.util.Log
import android.widget.Toast
import com.example.find.AppConfiguration
import kotlinx.coroutines.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import androidx.core.content.edit
import com.example.find.misc.TokenAuthenticator

class IdentificationService(private val context: Context, private val authService: AuthService) {
    private val client = OkHttpClient.Builder()
        .retryOnConnectionFailure(true)
        .authenticator(TokenAuthenticator { authService.refreshToken() })
        .build()
    private val json = Json { ignoreUnknownKeys = true }
    private val baseUrl = AppConfiguration.baseUrl
    private val sharedPref: SharedPreferences by lazy {
        context.getSharedPreferences("identification_preferences", Context.MODE_PRIVATE)
    }

    @Serializable data class IdentificationRequest(val name: String, val fcmToken: String?)
    @Serializable data class IdentificationResponse(val id: Int, val name: String)

    private fun getDeviceName(): String {
        val manufacturer = Build.MANUFACTURER
        val model = Build.MODEL
        return if (model.startsWith(manufacturer, true)) model else "$manufacturer $model"
    }

    fun deleteIdentifier(){
        with(sharedPref.edit()) {
            putInt("device_id", 0)
            apply()
        }
    }
    private fun saveIdentifier(id: Int) {
        with(sharedPref.edit()) {
            putInt("device_id", id)
            apply()
        }
    }
    fun getIdentifier(): Int = sharedPref.getInt("device_id", 0)

    suspend fun identifyDevice(fcmToken: String? = null): Int = withContext(Dispatchers.IO) {
        val existingId = getIdentifier()
        if (existingId != 0) return@withContext existingId

        val url = "$baseUrl/device/identify"
        val jwt = authService.tokenService.getAccessToken() ?: return@withContext 0

        val body = json.encodeToString(IdentificationRequest(getDeviceName(), fcmToken))
            .toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url(url)
            .header("Authorization", "Bearer $jwt")
            .post(body)
            .build()

        runCatching {
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) error("HTTP ${response.code}")
                val responseBody = response.body?.string() ?: ""
                val parsed = json.decodeFromString<IdentificationResponse>(responseBody)
                saveIdentifier(parsed.id)
                parsed.id
            }
        }.onFailure { Log.e(TAG, it.message ?: "Identification failed") }
            .getOrDefault(0)
    }

    companion object { private const val TAG = "IdentificationService" }
}
