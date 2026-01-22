// src/components/MapPreview.tsx
// Interactive map component using Leaflet to show shelter location

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix Leaflet default marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  name?: string;
  city?: string;
  state?: string;
  className?: string;
}

export function MapPreview({ 
  latitude, 
  longitude, 
  name, 
  city, 
  state,
  className = "aspect-video"
}: MapPreviewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only initialize if we have valid coordinates
    if (!latitude || !longitude || !mapContainerRef.current) return;

    // Clean up any existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Initialize the map
    const map = L.map(mapContainerRef.current).setView([latitude, longitude], 13);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add a marker at the location
    const marker = L.marker([latitude, longitude]).addTo(map);

    // Add popup with location info
    if (name || city || state) {
      const popupContent = `
        <div class="font-medium">${name || 'Location'}</div>
        ${city && state ? `<div class="text-sm text-muted-foreground">${city}, ${state}</div>` : ''}
      `;
      marker.bindPopup(popupContent).openPopup();
    }

    mapRef.current = map;

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, name, city, state]);

  // Show loading/error state if coordinates are invalid
  if (!latitude || !longitude) {
    return (
      <div className={`${className} bg-secondary/50 rounded-xl flex items-center justify-center border-2 border-dashed border-border`}>
        <div className="text-center text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Map Unavailable</p>
          <p className="text-xs">Location coordinates not provided</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} rounded-xl overflow-hidden border-2 border-border`}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}