package com.example.find.misc

sealed class AuthState {
    object Checking : AuthState()
    object Unauthenticated : AuthState()
    object Authenticated : AuthState()
}