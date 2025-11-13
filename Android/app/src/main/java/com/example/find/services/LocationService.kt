package com.example.find

import android.content.Context
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.location.LocationRequest
import android.os.Looper
import android.widget.Toast
import androidx.core.content.ContextCompat
import kotlinx.coroutines.flow.MutableStateFlow
import java.util.function.Consumer

class LocationService(private val context: Context) {
    private val locationManager: LocationManager =
        context.getSystemService(Context.LOCATION_SERVICE) as LocationManager

    val locationFlow = MutableStateFlow<Location?>(null)

    val isRunning = MutableStateFlow(false)

    val listener = LocationListener { location ->
        locationFlow.value = location
    }

    val consumer = Consumer<Location> { location ->
        locationFlow.value = location
    }

    fun requestSingleUpdate() {
        try {
            val locationRequest = LocationRequest.Builder(0).setQuality(LocationRequest.QUALITY_HIGH_ACCURACY).build()

            locationManager.getCurrentLocation(
                LocationManager.GPS_PROVIDER,
                locationRequest,
                null,
                ContextCompat.getMainExecutor(context),
                consumer
            )

            locationManager.getCurrentLocation(
                LocationManager.NETWORK_PROVIDER,
                locationRequest,
                null,
                ContextCompat.getMainExecutor(context),
                consumer
            )

//            locationManager.requestSingleUpdate(
//                LocationManager.GPS_PROVIDER,
//                listener,
//                Looper.getMainLooper()
//            )
//            locationManager.requestSingleUpdate(
//                LocationManager.NETWORK_PROVIDER,
//                listener,
//                Looper.getMainLooper()
//            )
        } catch (_: SecurityException) {
            Toast.makeText(context, "Location permission required", Toast.LENGTH_SHORT).show()
        }
    }

    fun startLocationUpdates(interval: Long) {
        isRunning.value = true

        try {
            locationManager.requestLocationUpdates(
                LocationManager.GPS_PROVIDER,
                interval,
                0f,
                listener,
                Looper.getMainLooper()
            )
            locationManager.requestLocationUpdates(
                LocationManager.NETWORK_PROVIDER,
                interval,
                0f,
                listener,
                Looper.getMainLooper()
            )
        } catch (_: SecurityException) {
            Toast.makeText(context, "Location permission required", Toast.LENGTH_SHORT).show()
        }
    }

    fun stopLocationUpdates() {
        isRunning.value = false
        locationFlow.value = null

        try {
            locationManager.removeUpdates(listener)
        } catch (_: SecurityException) {

        }
    }
}