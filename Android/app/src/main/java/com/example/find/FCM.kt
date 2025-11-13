package com.example.find

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Looper
import android.util.Log
import android.widget.Toast
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.Icon
import androidx.core.app.NotificationCompat
import androidx.core.graphics.drawable.IconCompat
import androidx.work.OneTimeWorkRequest
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.example.find.services.AuthService
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class FCM: FirebaseMessagingService() {
    private val authService: AuthService by lazy { AuthService(applicationContext) }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        if(remoteMessage.data.isNotEmpty()) {
            Log.d(TAG, "Received message: ${remoteMessage.data}")
            val action = remoteMessage.data["action"]

            if(action == "FETCH_LOCATION") {
                //if(foreground || foregroundService)
                val work = OneTimeWorkRequest.Builder(LocationWorker::class.java).build()
                WorkManager.getInstance(this).beginWith(work).enqueue()
            }
        } else {

        }
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        CoroutineScope(Dispatchers.IO).launch {
            Log.d(TAG, "New registration token: $token")
            authService.submitRegistrationToken(token)
        }
    }

    companion object {
        private const val TAG = "FCM"
    }
}