import { Device } from "../types";
import { Smartphone, RotateCcw, Plus, LogOut } from 'lucide-react';
import { usePinContext } from "../pin-context";
import { Spinner } from "../ui/spinner";
import { useMap } from "@vis.gl/react-google-maps";
import Modal from "../modals/reusable";
import { Dispatch, SetStateAction, useState } from "react";
import api from "../api";

const API_URL = process.env.NEXT_PUBLIC_API_URL as string 

export default function DeviceList({
  devices,
  fetchDevices,
  isLoading,
  setControls,
  setDevices
}: {
  devices: Device[] | null,
  fetchDevices: () => void,
  isLoading?: boolean,
  setControls: (id: number | null) => void,
  setDevices: Dispatch<SetStateAction<Device[] | null>>
}) {
  const context = usePinContext()
  const map = useMap()

  const handleDeviceClick = (device: Device) => {
    setControls(device.id)

    if(device.last_location) {
      const lng = device.last_location?.lng
      const lat = device.last_location?.lat

      map?.setCenter({lat: lat, lng: lng})
      map?.setZoom(18)
      context.setPinState({lng: lng, lat: lat, pinVisible: true, radius: device.last_location.horizontal_accuracy, heading: device.last_location.heading})
    }
  }

  const handleLogout = async () => {
    const response = await api.logout()
    if(response.status == 200) {
      setControls(null)
    } else {
      // Toast
    }
  }

  return (
    <>
      <div className='flex justify-between items-start mb-4'>
        <h2 className="font-semibold text-lg mb-2">Device list</h2>
        <div className="flex justify-end">
          <button onClick={fetchDevices} className="text-gray-500 cursor-pointer hover:bg-gray-100 p-2 rounded-full"><RotateCcw/></button>
          {/* <button onClick={handleDeviceAdd} className="text-gray-500 cursor-pointer hover:bg-gray-100 p-2 rounded-full"><Plus/></button> */}
          <button onClick={handleLogout} className="text-gray-500 cursor-pointer hover:bg-gray-100 p-2 rounded-full"><LogOut/></button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <Spinner/>
        </div>
      ) : (
        devices ? (
          <ul className="space-y-2 overflow-y-auto">
            {devices.map((device) => (
              <li key={device.id} onClick={() => {handleDeviceClick(device)}} className="p-2 px-2 w-full h-20 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer flex">
              <div className="h-16 w-16 flex items-center ml-2 rounded-full">
                <Smartphone size={32}/>
              </div>
              <div className="flex flex-col items-start w-full">
                <h3 className="font-medium flex items-center">
                  {/* <div className={`w-2 h-2 mr-1 mt-[1px] ${device.connected ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></div> */}
                  {device.name}</h3>
                {device.last_location ? (
                  <div className="text-sm text-gray-600">
                    <p>Last seen at: {new Date(device.last_location.timestamp).toLocaleString()}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No location data</p>
                )}
              </div>
            </li>
            ))}
          </ul>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p>No devices avalible</p>
          </div>
        )
      )}
    </>
  );
}