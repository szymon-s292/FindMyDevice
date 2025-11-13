package com.example.find

import android.content.Context
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleObserver
import androidx.lifecycle.OnLifecycleEvent
import com.example.find.services.AuthService
import com.example.find.misc.AuthState
import com.example.find.services.IdentificationService
import com.example.find.ui.screens.HomeScreen
import com.example.find.ui.screens.LoadingScreen
import com.example.find.ui.screens.LoginScreen
import com.example.find.ui.theme.FindTheme
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.FirebaseMessagingService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private lateinit var permissions: Permissions
    private lateinit var authService: AuthService
    private lateinit var identificationService: IdentificationService

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val scope = CoroutineScope(Dispatchers.Main)

        permissions = Permissions(this)
        permissions.requestAll()
        authService = AuthService(this)
        identificationService = IdentificationService(this, authService)

        //check network state
        scope.launch {
            val result = authService.check()
            result.onSuccess {
                Log.d(TAG, "Authenticated")
            }
            result.onFailure { error ->
                Log.e(TAG, error.message.toString())
            }
        }

        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            Log.d("FCM", task.result)
        }

        enableEdgeToEdge()
        setContent {
            val authState by authService.authState.collectAsState()
            FindTheme {
                when(authState) {
                    is AuthState.Authenticated -> HomeScreen(authService, identificationService)
                    is AuthState.Checking -> LoadingScreen()
                    is AuthState.Unauthenticated -> {
                        Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                            Box(modifier = Modifier.padding(innerPadding)) {
                                LoginScreen(authService = authService, identificationService)
                            }
                        }
                    }
                }
            }
        }
    }

    companion object {
        private const val TAG = "MainActivity"
        var isInForeground = true
    }
}