package com.example.find

import android.Manifest
import android.content.pm.PackageManager
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat

class Permissions(private val activity: ComponentActivity) {

    private var pendingPermission: String? = null
    private var onDone: (() -> Unit)? = null
    private val launcher: ActivityResultLauncher<String> =
        activity.registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            pendingPermission?.let { permission ->
                handlePermissionResult(permission, isGranted)
            }
            pendingPermission = null

            this.onDone?.invoke()
            this.onDone = null
        }

    fun launch(permission: String, onDone: (() -> Unit)? = null) {
        pendingPermission = permission
        this.onDone = onDone
        launcher.launch(permission)
    }

    private fun handlePermissionResult(permission: String, isGranted: Boolean) {
        if (isGranted) {
            when (permission) {
                Manifest.permission.ACCESS_FINE_LOCATION -> {
                    Toast.makeText(activity, "Precise location granted ✅", Toast.LENGTH_SHORT).show()
                    requestBackgroundLocation()
                }
                Manifest.permission.ACCESS_BACKGROUND_LOCATION -> {
                    Toast.makeText(activity, "Background location granted ✅", Toast.LENGTH_SHORT).show()
                }
                Manifest.permission.POST_NOTIFICATIONS -> {
                    Toast.makeText(activity, "Notification permission granted ✅", Toast.LENGTH_SHORT).show()
                }
            }
        } else {
            when (permission) {
                Manifest.permission.ACCESS_FINE_LOCATION -> {
                    Toast.makeText(activity, "Precise location denied ❌", Toast.LENGTH_SHORT).show()
                }
                Manifest.permission.ACCESS_BACKGROUND_LOCATION -> {
                    Toast.makeText(activity, "Background location denied ❌", Toast.LENGTH_SHORT).show()
                }
                Manifest.permission.POST_NOTIFICATIONS -> {
                    Toast.makeText(activity, "Notification permission denied ❌", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    fun checkAndRequestLocation(onDone: (() -> Unit)? = null) {
        val fine = ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_FINE_LOCATION)
        val coarse = ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_COARSE_LOCATION)

        if (fine == PackageManager.PERMISSION_GRANTED || coarse == PackageManager.PERMISSION_GRANTED) {
            requestBackgroundLocation { onDone }
        } else {
            Toast.makeText(activity, "Requesting precise location…", Toast.LENGTH_SHORT).show()
            pendingPermission = Manifest.permission.ACCESS_FINE_LOCATION
            launch(Manifest.permission.ACCESS_FINE_LOCATION, onDone)
        }
    }

    private fun requestBackgroundLocation(onDone: (() -> Unit)? = null) {
        if (ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_BACKGROUND_LOCATION)
            != PackageManager.PERMISSION_GRANTED
        ) {
            Toast.makeText(activity, "Requesting background location…", Toast.LENGTH_SHORT).show()
            pendingPermission = Manifest.permission.ACCESS_BACKGROUND_LOCATION
            launch(Manifest.permission.ACCESS_BACKGROUND_LOCATION, onDone)
        }
    }

    fun checkAndRequestNotifications(onDone: (() -> Unit)? = null) {
        val notifications = ContextCompat.checkSelfPermission(activity, Manifest.permission.POST_NOTIFICATIONS)

        if(notifications == PackageManager.PERMISSION_DENIED) {
            Toast.makeText(activity, "Requesting notifications permission…", Toast.LENGTH_SHORT).show()
            pendingPermission = Manifest.permission.POST_NOTIFICATIONS
            launch(Manifest.permission.POST_NOTIFICATIONS, onDone)
        }
    }

    fun requestAll() {
        checkAndRequestNotifications {
            checkAndRequestLocation {
                Toast.makeText(activity, "All permissions granted!", Toast.LENGTH_SHORT).show()
            }
        }
    }
}