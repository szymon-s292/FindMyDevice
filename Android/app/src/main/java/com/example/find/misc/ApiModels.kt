package com.example.find.misc

import kotlinx.serialization.Serializable

sealed class ApiModels {
    @Serializable
    data class LoginRequest(val email: String, val password: String)
    @Serializable
    data class LoginResponse(val accessToken: String, val refreshToken: String)

    @Serializable
    data class RefreshResponse(val accessToken: String)

    @Serializable
    data class IdentificationRequest(val name: String, val fcmToken: String?)
    @Serializable
    data class IdentificationResponse(val id: Int, val name: String)
}