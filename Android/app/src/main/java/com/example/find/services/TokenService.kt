package com.example.find.services

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import androidx.core.content.edit

class TokenService(private val context: Context) {
    private val masterKeyAlias: MasterKey by lazy {
        MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
    }

    private val sharedPrefs: SharedPreferences by lazy {
        EncryptedSharedPreferences.create(
            context,
            "encrypted_preferences",
            masterKeyAlias,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    fun saveAccessToken(token: String) {
        sharedPrefs.edit {
            putString("access_token", token)
        }
    }

    fun saveRefreshToken(token: String) {
        sharedPrefs.edit {
            putString("refresh_token", token)
        }
    }

    fun getAccessToken(): String? {
        return sharedPrefs.getString("access_token", null)
    }

    fun getRefreshToken(): String? {
        return sharedPrefs.getString("refresh_token", null)
    }

    fun clearTokens() {
        sharedPrefs.edit { clear() }
    }
}