"use client";
import { APIProvider, Map, MapControl, Marker, ControlPosition, AdvancedMarker, MapCameraChangedEvent, useMap, Pin } from '@vis.gl/react-google-maps';
import api from './api';
import { use, useCallback, useEffect, useState } from 'react';
import { Device, DeviceLocation } from './types';
import DeviceList from './views/device-list';
import DeviceControls from './views/device-controls';
import { usePinContext } from './pin-context';
import LocationCircle from './ui/circle';
import Login from './ui/login';
import { isAxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL as string 

export default function Home() {
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [devicesLoading, setDevicesLoading] = useState<boolean>(false);
  const [view, setView] = useState<number | null>(null);
  const [showPin, setShowPin] = useState<boolean>(false);
  const [findLoaded, setFindLoaded] = useState<boolean>(false);
  const [tilesLoaded, setTilesLoaded] = useState<boolean>(false);
  const [liveStatus, setLiveStatus] = useState<string>("");

  const startLiveUpdates = async () => {
    try{
      const response = await api.post(API_URL + '/live-status')
      if(response.status == 200) {
        const url = response.data?.url;
        const token = response.data?.token;
        setLiveStatus(url + '?token=' + token)
      }
    } catch(err) {

    } finally {

    }
  }

  useEffect(() => {
    if(liveStatus == "") return
    
    const websocket = new WebSocket(liveStatus)

    const setDeviceConnected = (deviceId: number, connected: boolean) => {
      setDevices(prev => prev ? prev.map(d => d.id == deviceId ? {...d, connected} : d) : prev);
    }

    websocket.onopen = () => {}

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        const deviceId = data?.deviceId
        const connected = data?.connected
  
        if(deviceId != undefined && connected != undefined) {
          setDeviceConnected(deviceId, connected)
        }
      } catch (err) {

      }
    }

    websocket.onerror = () => {
      setLiveStatus("")
      websocket.close()
    }

    websocket.onclose = () => {
      setLiveStatus("")
    }

    return () => {
      websocket.close();
    };
  }, [liveStatus])

  const fetchDevices = async () => {
    try {
      setDevicesLoading(true)
      const response = await api.getDevices()
      if(response.status == 200) {
        const data = response.data
        setDevices(data)
        setView(0)
      } 
    } catch(err) {
      if(isAxiosError(err)) {
        if(err.response?.status == 401) {
          setView(null)
        } else {
          
        }
      }
    } finally{
      setDevicesLoading(false)
    }
  }

  const map = useMap()
  useEffect(() => {
    if(!map)
      return

    const handleZoom = () => {
      const zoom = map.getZoom()

      if(!zoom)
        return 

      setShowPin(zoom < 18)
    }

    handleZoom()
  
    const listener = map.addListener("zoom_changed", handleZoom)
    return () => {listener.remove()}
  }, [map])

  useEffect(() => {
    fetchDevices()
    // startLiveUpdates()
  }, [])

  useEffect(() => {
    if(view != null && view == 0)
      fetchDevices()
  }, [view])

  const pinContext = usePinContext();

  return (
      <main className="relative w-full h-screen">
        <aside className="absolute top-4 left-4 w-[22rem] max-h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-lg z-20 p-4">
          {(view == null) ? (
            <Login setView={setView}/>
          ) : (
            view == 0 ? (
              <DeviceList devices={devices} fetchDevices={fetchDevices} setControls={setView} isLoading={devicesLoading} setDevices={setDevices}/>
            ) : (
              devices && <DeviceControls device={devices.filter((d) => d.id == view)[0]} setDevices={setDevices} setControls={setView}/>
            )
          )}
        </aside>

        <section className="w-full h-full">
          <Map
            style={{ width: '100%', height: '100%' }}
            defaultCenter={{ lat: 0, lng: -30 }}
            defaultZoom={2}
            zoomControl={true}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            mapId={process.env.NEXT_PUBLIC_MAP_ID || ''}
            colorScheme='LIGHT'
          >
            {(pinContext.pinVisible && !showPin) && <AdvancedMarker position={{lat: pinContext.lat, lng: pinContext.lng}}>
              <LocationCircle position={{lat: pinContext.lat, lng: pinContext.lng, radius: pinContext.radius, heading: pinContext.heading, live: pinContext.live}}></LocationCircle>
            </AdvancedMarker>}

            {(showPin && pinContext.pinVisible) && <Marker position={{lat: pinContext.lat, lng: pinContext.lng}}></Marker>}
          </Map>
        </section>
      </main>
  );
}
