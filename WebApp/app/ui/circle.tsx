import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";

export default function LocationCircle({
  position,
}: {
  position: { lat: number; lng: number; radius: number; heading: number, live?: boolean };
}) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);
  const pulseCircleRef = useRef<google.maps.Circle | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { lat, lng, radius, live } = position;

  useEffect(() => {
    if (!map) return;

    circleRef.current = new google.maps.Circle({
      strokeColor: live ? "oklch(62.7% 0.194 149.214)" : "#4285F4",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: live ? "oklch(62.7% 0.194 149.214)" : "#4285F4",
      fillOpacity: 0.35,
      map,
      center: { lat, lng },
      radius: radius,
    });

    let pulseRadius = radius;
    pulseCircleRef.current = new google.maps.Circle({
      strokeColor: live ? "oklch(62.7% 0.194 149.214)" : "#4285F4",
      strokeOpacity: 0.5,
      strokeWeight: 1,
      fillColor: live ? "oklch(62.7% 0.194 149.214)" : "#4285F4",
      fillOpacity: 0.2,
      map,
      center: { lat, lng },
      radius: pulseRadius,
    });

    const animate = () => {
      if (!pulseCircleRef.current) return;

      pulseRadius += 0.1;
      const opacity = Math.max(0.4 - (pulseRadius - radius) / radius / 2, 0);
      pulseCircleRef.current.setOptions({
        radius: pulseRadius,
        fillOpacity: opacity,
        strokeOpacity: opacity,
      });

      if (pulseRadius > radius * 2) {
        pulseRadius = radius;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if(live) animate();

    return () => {
      if (circleRef.current) circleRef.current.setMap(null);
      if (pulseCircleRef.current) pulseCircleRef.current.setMap(null);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [map, lat, lng, radius, live]);

  return null;
}
