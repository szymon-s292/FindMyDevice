package com.example.find.misc

import android.util.Log
import kotlinx.coroutines.runBlocking
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route

class TokenAuthenticator(private val refreshTokenCall: suspend () -> Result<ApiModels.RefreshResponse>) :
    Authenticator {
    override fun authenticate(route: Route?, response: Response): Request? {
        if (responseCount(response) >= 2) {
            Log.w("TokenAuthenticator", "Too many authentication attempts, giving up")
            return null
        }

        Log.d("TokenAuthenticator", "401 detected — attempting token refresh")

        val refreshResult = runBlocking { refreshTokenCall() }

        return if (refreshResult.isSuccess) {
            val newAccessToken = refreshResult.getOrNull()?.accessToken
            if (newAccessToken.isNullOrEmpty()) {
                Log.e("TokenAuthenticator", "Refresh succeeded but accessToken is null/empty")
                return null
            }

            Log.d("TokenAuthenticator", "Token refreshed — retrying request")
            response.request.newBuilder()
                .header("Authorization", "Bearer $newAccessToken")
                .build()
        } else {
            Log.e("TokenAuthenticator", "Token refresh failed: ${refreshResult.exceptionOrNull()?.message}")
            null
        }
    }
    private fun responseCount(response: Response): Int {
        var count = 1
        var prior = response.priorResponse
        while (prior != null) {
            count++
            prior = prior.priorResponse
        }
        return count
    }
}