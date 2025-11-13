package com.example.find

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.location.LocationRequest
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.core.util.Consumer
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.example.find.misc.TokenAuthenticator
import com.example.find.services.AuthService
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import kotlin.coroutines.resume

class LocationWorker(private val appContext: Context, workerParams: WorkerParameters) : CoroutineWorker(appContext, workerParams) {
    private val authService = AuthService(appContext)
    private val client = OkHttpClient.Builder()
        .retryOnConnectionFailure(true)
        .authenticator(TokenAuthenticator { authService.refreshToken() })
        .build()
    private fun Location.toJson(): String {
        return """
            {
                "location": {
                    "lat": $latitude,
                    "lng": $longitude,
                    "altitude": ${altitude.toInt()},
                    "horizontal_accuracy": ${accuracy.toInt()},
                    "vertical_accuracy": ${verticalAccuracyMeters.toInt()},
                    "speed": ${speed.toInt()}
                }
            }
        """.trimIndent()
    }

    private suspend fun fetchCurrentLocation(): Location? {
        val fusedLocationProvider = LocationServices.getFusedLocationProviderClient(appContext)

        return suspendCancellableCoroutine { continuation ->
            try {
                val cancellationTokenSource = CancellationTokenSource()
                fusedLocationProvider.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, cancellationTokenSource.token)
                    .addOnCompleteListener { task ->
                        Log.d(TAG, "FusedLocationProvider Success")

                        if(task.result == null) {
                            fusedLocationProvider.lastLocation.addOnCompleteListener { task ->
                                Log.d(TAG, "Returning last known location")
                                continuation.resume(task.result)
                            }
                        } else {
                            Log.d(TAG, "Returning provided location")
                            continuation.resume(task.result)
                        }
                    }
                    .addOnFailureListener { exception ->
                        Log.e(TAG, "FusedLocationProvider Failure ${exception.message.toString()}")
                        continuation.resume(null)
                    }
            } catch (secEx: SecurityException) {
                Log.e(TAG, "Location permission security exception", secEx)
                if (continuation.isActive) {
                    continuation.resume(null)
                }
            } catch (e: Exception) {
                Log.e(TAG, "General error requesting location", e)
                if (continuation.isActive) {
                    continuation.resume(null)
                }
            }
        }
    }

    override suspend fun doWork(): Result {
        Log.d(TAG, "Starting location work.")

        val hasFinePermission = ContextCompat.checkSelfPermission(appContext, Manifest.permission.ACCESS_FINE_LOCATION)
        val hasBackgroundPermission = ContextCompat.checkSelfPermission(appContext, Manifest.permission.ACCESS_BACKGROUND_LOCATION)

        if (hasFinePermission != PackageManager.PERMISSION_GRANTED || hasBackgroundPermission != PackageManager.PERMISSION_GRANTED) {
            Log.e(TAG, "Location acquisition failed: Missing FINE or BACKGROUND location permission.")
            return Result.failure()
        }

        val location = fetchCurrentLocation()

        if (location == null) {
            Log.e(TAG, "Location is null. Not uploading.")
            return Result.failure()
        }

        val jsonBody = location.toJson()
        val mediaType = "application/json; charset=utf-8".toMediaType()
        val accessToken = authService.tokenService.getAccessToken()
        if (accessToken == null)
            return Result.failure()

        val request = Request.Builder()
            .url("${AppConfiguration.baseUrl}/device/gateway")
            .post(jsonBody.toRequestBody(mediaType))
            .header("Authorization", "Bearer $accessToken")
            .build()


        return try {
            withContext(Dispatchers.IO) {
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        Log.d(TAG, "Location successfully uploaded. Code: ${response.code}")
                        Result.success()
                    } else {
                        val responseBody = response.body?.string()
                        Log.e(TAG, "Failed to upload location. Code: ${response.code}, Body: $responseBody")
                        Result.failure()
                    }
                }
            }
        } catch (e: IOException) {
            Log.e(TAG, "Network error during location upload: ${e.message}")
            Result.failure()
        } catch (e: Exception) {
            Log.e(TAG, "Unexpected error during location upload: ${e.message}")
            Result.failure()
        }
    }

    companion object {
        private const val TAG = "LocationWorker"
    }
}