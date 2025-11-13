"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

type PinContextType = {
  lat: number;
  lng: number;
  radius: number;
  heading: number;
  pinVisible: boolean;
  live?: boolean
  setPinState: (state: Partial<PinContextType>) => void;
  setIsLive: (state: Partial<PinContextType>) => void;
};

const defaultState: PinContextType = {
  lat: 0,
  lng: 0,
  radius: 10,
  pinVisible: false,
  heading: 0,
  live: false,
  setIsLive: () => {},
  setPinState: () => {},
};

const PinContext = createContext<PinContextType>(defaultState);

export const usePinContext = () => useContext(PinContext);

export const PinProvider = ({ children }: { children: ReactNode }) => {
  const [lat, setLat] = useState(defaultState.lat);
  const [lng, setLng] = useState(defaultState.lng);
  const [radius, setRadius] = useState(defaultState.radius);
  const [heading, setHeading] = useState(defaultState.heading);
  const [pinVisible, setPinVisible] = useState(defaultState.pinVisible);
  const [live, setLive] = useState(defaultState.live)

  const setPinState = (state: Partial<PinContextType>) => {
    if (state.lat !== undefined) setLat(state.lat);
    if (state.lng !== undefined) setLng(state.lng);
    if (state.radius !== undefined) setRadius(state.radius);
    if (state.pinVisible !== undefined) setPinVisible(state.pinVisible);
  };

  const setIsLive = (state: Partial<PinContextType>) => {
    if(state.live !== undefined) setLive(state.live)
  }

  return (
    <PinContext.Provider
      value={{
        lat,
        lng,
        radius,
        pinVisible,
        heading,
        live,
        setPinState,
        setIsLive,
      }}
    >
      {children}
    </PinContext.Provider>
  );
};