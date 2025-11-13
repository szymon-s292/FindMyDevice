package com.example.find.ui.screens

import android.app.Activity
import android.content.Context
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarDefaults
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.compose.rememberNavController
import com.example.find.ui.theme.FindTheme
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Button
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.example.find.services.AuthService
import com.example.find.services.IdentificationService
import com.google.firebase.DataCollectionDefaultChange
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

enum class Destinations(
    val route: String,
    val icon: ImageVector,
    val label: String,
    val contentDescription: String
) {
    MAP("map", Icons.Default.Place, "Map", "Map view"),
    OTHER_DEVICES("other_devices", Icons.Default.Favorite, "Other devices", "List of devices"),
    SETTINGS("settings", Icons.Default.Settings, "Settings", "App settings")
}

@Composable
fun HomeScreen(authService: AuthService, identificationService: IdentificationService) {
    val navController = rememberNavController()
    val startDestination = Destinations.OTHER_DEVICES
    var selectedDestinationIndex by rememberSaveable { mutableIntStateOf(startDestination.ordinal) }

    Scaffold(
        bottomBar = {
            NavigationBar {
                Destinations.entries.forEachIndexed { index, destination ->
                    NavigationBarItem(
                        selected = selectedDestinationIndex == index,
                        onClick = {
                            selectedDestinationIndex = index
                            navController.navigate(destination.route) {
                                popUpTo(navController.graph.startDestinationId) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = {
                            Icon(destination.icon, contentDescription = destination.contentDescription)
                        },
                        label = {
                            Text(destination.label)
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        AppNavHost(
            navController = navController,
            startDestination = startDestination,
            modifier = Modifier.padding(innerPadding),
            authService = authService,
            identificationService = identificationService
        )
    }
}

@Composable
fun MapScreen(modifier: Modifier = Modifier) {
    Box(modifier = modifier.padding(24.dp)) {
        Text("🗺️ Map Screen — maybe combine map and device list")
    }
}

@Composable
fun OtherDevicesScreen(modifier: Modifier = Modifier) {
    Box(modifier = modifier.padding(24.dp)) {
        Text("📱 Other Devices — shows user's registered devices")
    }
}

@Composable
fun SettingsScreen(authService: AuthService, identificationService: IdentificationService) {
    Box(modifier = Modifier.padding(24.dp)) {
        Button({
            CoroutineScope(Dispatchers.IO).launch {
                val result = authService.logout()
                result.onSuccess {
                    Log.d("Logout", "Success")
                }
                result.onFailure { error ->
                    Log.e("Logout", error.message.toString())
                }
            }
        }) { Text("Logout") }
        Text(identificationService.getIdentifier().toString(), modifier = Modifier.padding(top=64.dp))
    }
}

@Composable
fun AppNavHost(
    navController: NavHostController,
    startDestination: Destinations,
    modifier: Modifier = Modifier,
    authService: AuthService,
    identificationService: IdentificationService
) {
    NavHost(
        navController = navController,
        startDestination = startDestination.route,
        modifier = modifier
    ) {
        composable(Destinations.MAP.route) { MapScreen() }
        composable(Destinations.OTHER_DEVICES.route) { OtherDevicesScreen() }
        composable(Destinations.SETTINGS.route) { SettingsScreen(authService, identificationService) }
    }
}
