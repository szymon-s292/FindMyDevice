import api from "@/app/api";
import { Device, DeviceLocation } from "../types";
import { ChevronLeft, ClipboardClock, History, KeyRound, LocateFixed, LucideLocationEdit, MapPin, Mic, Volume2, Volume2Icon } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Spinner } from "../ui/spinner";
import { usePinContext } from "../pin-context";
import { useMap } from "@vis.gl/react-google-maps";
import ControlButton from "../ui/control-button";
import Modal from "../modals/reusable";
import DeviceQrKey from "../ui/device-qr";

const API_URL = process.env.NEXT_PUBLIC_API_URL as string

export default function DeviceControls({
  device,
  setControls,
  setDevices
}: {
  device: Device,
  setControls: (id: number | null) => void,
  setDevices: Dispatch<SetStateAction<Device[] | null>>
}) {
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  // const [liveLocation, setLiveLocation] = useState<string>("");

  const map = useMap()
  const pinContext = usePinContext()

  const locateDevice = async () => {
    setIsLoadingLocation(true)
    const response = await api.locateDevice(device.id)

    if(response.status == 200 && response.data) {
      const data = await response.data as DeviceLocation;

      setDevices((prev) => {
        if (prev && data) {
          return prev.map((d) => d.id === device.id ? { ...d, last_location: data } : d);
        }
        return prev;
      });

      if(data) {
        const lng = data?.lng
        const lat = data?.lat
        
        map?.setCenter({lat: lat, lng: lng})
        map?.setZoom(18)

        pinContext.setPinState({lat: lat, lng: lng, pinVisible: true, radius: data.horizontal_accuracy, heading: data.heading})
      }
      
    } else if (response.status == 204) {
      //Toast device is offline
    } else {
      //Toast.error
    } 
    setIsLoadingLocation(false)
  }

  const handleBack = () => {
    setControls(0)
    map?.setCenter({lat: 0, lng: -30})
    map?.setZoom(2)
    pinContext.setPinState({lat: 0, lng: 0, pinVisible: false, radius: 0, heading: 0})
  }

  // useEffect(() => {
  //   if(liveLocation == "") return

  //   const websocket = new WebSocket(liveLocation)

  //   websocket.onopen = () => {
  //     console.log('Connected')
  //   };

  //   websocket.onmessage = (event) => {
  //     try {
  //       setIsLiveLocationLoading(false)
        
  //       const data = JSON.parse(event.data) 
        
  //       if(data?.error) {
  //         console.log("Device went offline shuting down live location session")
  //       } else {

  //         pinContext.setIsLive({live: true})
  //         const locationData = data as DeviceLocation
  //         const lng = locationData?.lng
  //         const lat = locationData?.lat
            
  //         map?.setCenter({lat: lat, lng: lng})
  //         map?.setZoom(18)

  //         pinContext.setPinState({lat: lat, lng: lng, pinVisible: true, radius: locationData.horizontal_accuracy, heading: locationData.heading, live: true})

  //         setDevices((prev) => {
  //           if (prev && locationData) {
  //             return prev.map((d) => d.id === device.id ? { ...d, last_location: locationData } : d);
  //           }
  //           return prev;
  //         });
  //       }
  //     } catch (err) {

  //     }
  //   };

  //   websocket.onerror = () => {
  //     setLiveLocation("")
  //     pinContext.setIsLive({live: false})
  //     websocket.close()
  //   };

  //   websocket.onclose = () => {
  //     setLiveLocation("")
  //     pinContext.setIsLive({live: false})
  //   };

  //   return () => {
  //     websocket.close();
  //   };
    
  // }, [liveLocation])

  return (
    <>
      <div className='flex justify-between items-start'>
        <h2 className="font-semibold text-lg mb-2">{device.name}</h2>
        <div className="flex">
          {/* <button onClick={() => setShowKeyModal(true)} className="hover:bg-gray-100 p-2 rounded-full text-gray-500 my-1 cursor-pointer"><KeyRound/></button> */}
          <button onClick={() => {handleBack()}} className="hover:bg-gray-100 p-2 rounded-full text-gray-500 my-1 cursor-pointer"><ChevronLeft/></button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs border-b pb-4 border-gray-300">
        <div className="flex items-center gap-1 text-xs">
          {/* <div className={`w-2 h-2 ${device.connected ? 'bg-green-500' : 'bg-red-500'} ml-1 rounded-full`}></div>{device.connected ? 'Online' : 'Offline'} */}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <ControlButton onClick={locateDevice} disabled={isLoadingLocation} loading={isLoadingLocation} label="Locate"><MapPin size={24} /></ControlButton>
        {/* <ControlButton onClick={() => {}} disabled={isLiveLocationLoading} loading={isLiveLocationLoading} color={pinContext.live ? 'bg-emerald-200/80 hover:bg-emerald-300/80' : undefined} animate={pinContext.live} label="Live location"><LocateFixed size={24} /></ControlButton> */}
        {/* <ControlButton onClick={() => {}} disabled={false} loading={false} label="Live listen"><Mic size={24} /></ControlButton> */}
        {/* <ControlButton onClick={() => {}} disabled={false} loading={false} label="Event log"><ClipboardClock size={24} /></ControlButton> */}
        {/* <ControlButton onClick={() => {}} disabled={false} loading={false} label="Location log"><LucideLocationEdit size={24}/></ControlButton> */}
        {/* <ControlButton onClick={() => {}} disabled={false} loading={false} label="Ring"><Volume2Icon size={24}/></ControlButton> */}
      </div>

      <div className="mt-4 border-t pt-4 border-gray-300">
        {device.last_location ? (
          <div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>Last seen: {new Date(device.last_location.timestamp).toLocaleString()}</li>
              <li>Latitude: {device.last_location.lat}</li>
              <li>Longitude: {device.last_location.lng}</li>
              <li>Altitude: {device.last_location.altitude} m</li>
              <li>Accuracy: {device.last_location.horizontal_accuracy} m</li>
              {/* <li>Vertical Accuracy: {device.last_location.vertical_accuracy} meters</li> */}
              <li>Speed: {Number(device.last_location.speed * 3.6).toFixed(0)} km/h</li>
              {/* <li>Heading: {device.last_location.heading}</li> */}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-gray-600">No location data available for this device.</p>
        )}
      </div>

      {/* <div className="mt-4 border-t pt-4 border-gray-300">
        <button className="w-full bg-red-300 hover:bg-red-400 text-center text-sm text-white rounded-lg py-2 cursor-pointer">Unregister from find network</button>
      </div> */}
    </>
  );
}