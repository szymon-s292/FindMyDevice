export interface DeviceLocation {
    id: number
    lat: number,
    lng: number,
    horizontal_accuracy: number,
    vertical_accuracy: number,
    altitude: number,
    heading: number,
    speed: number
    timestamp: string
}

export interface Device {
    id: number
    name: string
    key: string
    connected: boolean
    last_location: DeviceLocation | null
}