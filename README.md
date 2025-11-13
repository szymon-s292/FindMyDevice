# FindMyDevice

A complete end-to-end solution for locating and managing Android devices. This project includes a web dashboard, Android mobile app, and backend services designed for secure, reliable device tracking.

---

## 🚀 Features

### 🔍 Device Tracking
- Locate your Android device directly from the web interface  
- Real-time location updates  
- Works even when the device is idle or in Doze mode

### 🔐 Authentication & Security
- Secure refresh & access token flow  
- Cookie-based authentication for web sessions  
- Advanced session management for improved security

### 📱 Android App Capabilities
- Persistent background service to ensure high availability for location requests  
- Background location fetching powered by **WorkManager**  
- FCM-triggered location updates using **Firebase Cloud Messaging**

### 🗺️ Integrations
- **Google Maps API** for interactive location display  
- **Firebase Messaging Service** to trigger and manage device updates

---

## 🧰 Technical Details

- **Auth:** Refresh/Access token system + cookie-based auth  
- **Background Tasks:** WorkManager jobs triggered via FCM  
- **Notifications / Messaging:** Firebase Messaging Service integration  
- **Mapping:** Google Maps API  
- **Android:** Continuous background service for reliable tracking

---

## 🧭 Coming Soon

### 🚩 Foreground Location Service  
A dedicated foreground service to overcome Android restrictions on background location access and ensure consistent, high-frequency location updates.

### 🔔 Remote Phone Ring  
Trigger a loud ring on the device from the web dashboard, even when the device is in silent mode, to help locate it nearby.

### 🗂️ Location History  
View a timeline of the device’s past locations with map-based visualization and time filtering.

### 📡 IoT Device Finding Firmware  
Lightweight firmware for IoT trackers to integrate with the same backend and web interface, enabling universal tracking across phones and IoT devices.


If you find this project helpful, consider giving it a **star** on GitHub!
