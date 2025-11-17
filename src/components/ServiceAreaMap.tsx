import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface ValidatedAddress {
  address: string;
  coordinates?: [number, number];
  isValid: boolean;
  estimatedMinutes?: number;
}

interface ServiceAreaMapProps {
  validatedAddress?: ValidatedAddress | null;
}

const ServiceAreaMap = ({ validatedAddress }: ServiceAreaMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const validatedMarkerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    // Get Mapbox token from environment
    const token = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    if (token) {
      setMapboxToken(token);
      mapboxgl.accessToken = token;
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    const restaurantCoords: [number, number] = [-74.0060, 40.6501]; // 505 51st Street, Brooklyn

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: restaurantCoords,
      zoom: 12,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add restaurant marker
    const el = document.createElement('div');
    el.className = 'restaurant-marker';
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlZjQ0NDQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjAgMTBjMCA2LTggMTItOCAxMnMtOC02LTgtMTJhOCA4IDAgMCAxIDE2IDB6Ii8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMCIgcj0iMyIvPjwvc3ZnPg==)';
    el.style.backgroundSize = 'cover';
    el.style.cursor = 'pointer';

    // Create popup content safely (avoid XSS by using textContent)
    const popupContent = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = 'Ricos Tacos';
    title.style.margin = '0';
    title.style.fontWeight = 'bold';
    const address = document.createElement('p');
    address.textContent = '505 51st Street, Brooklyn, NY 11220';
    address.style.margin = '0';
    popupContent.appendChild(title);
    popupContent.appendChild(address);

    new mapboxgl.Marker(el)
      .setLngLat(restaurantCoords)
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setDOMContent(popupContent)
      )
      .addTo(map.current);

    // Fetch and display 15-minute isochrone (service area)
    map.current.on('load', async () => {
      try {
        const isochroneUrl = `https://api.mapbox.com/isochrone/v1/mapbox/driving/${restaurantCoords[0]},${restaurantCoords[1]}?contours_minutes=15&polygons=true&access_token=${mapboxToken}`;
        
        const response = await fetch(isochroneUrl);
        const data = await response.json();

        if (map.current && data.features && data.features.length > 0) {
          // Add the service area polygon
          map.current.addSource('service-area', {
            type: 'geojson',
            data: data,
          });

          map.current.addLayer({
            id: 'service-area-fill',
            type: 'fill',
            source: 'service-area',
            paint: {
              'fill-color': '#ef4444',
              'fill-opacity': 0.2,
            },
          });

          map.current.addLayer({
            id: 'service-area-outline',
            type: 'line',
            source: 'service-area',
            paint: {
              'line-color': '#ef4444',
              'line-width': 2,
              'line-dasharray': [2, 1],
            },
          });
        }
      } catch (error) {
        // Log error (in production, send to error tracking service)
        if (import.meta.env.DEV) {
          console.error('Error loading service area:', error);
        }
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Add validated address marker
  useEffect(() => {
    if (!map.current || !validatedAddress || !validatedAddress.coordinates) return;

    // Remove previous validated marker
    if (validatedMarkerRef.current) {
      validatedMarkerRef.current.remove();
    }

    // Create marker with color based on validity
    const color = validatedAddress.isValid ? '#22c55e' : '#f59e0b'; // green for valid, amber for invalid
    
    // Create popup content
    const popupContent = document.createElement('div');
    const statusText = document.createElement('p');
    statusText.textContent = validatedAddress.isValid 
      ? `✓ Delivery Available (${validatedAddress.estimatedMinutes} min)`
      : '✗ Outside Delivery Zone';
    statusText.style.margin = '0';
    statusText.style.fontWeight = 'bold';
    statusText.style.color = validatedAddress.isValid ? '#22c55e' : '#f59e0b';
    
    const addressText = document.createElement('p');
    addressText.textContent = validatedAddress.address;
    addressText.style.margin = '4px 0 0 0';
    addressText.style.fontSize = '0.875rem';
    
    popupContent.appendChild(statusText);
    popupContent.appendChild(addressText);

    // Add new marker
    validatedMarkerRef.current = new mapboxgl.Marker({ color })
      .setLngLat(validatedAddress.coordinates)
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setDOMContent(popupContent)
      )
      .addTo(map.current);

    // Fly to validated address
    map.current.flyTo({
      center: validatedAddress.coordinates,
      zoom: 13,
      duration: 1500,
    });

    return () => {
      if (validatedMarkerRef.current) {
        validatedMarkerRef.current.remove();
      }
    };
  }, [validatedAddress]);

  if (!mapboxToken) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-5 w-5" />
          <p>Map loading...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden shadow-lg">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-md max-w-xs">
        <div className="flex items-start gap-2">
          <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm mb-1">15-Minute Delivery Zone</h4>
            <p className="text-xs text-muted-foreground">The shaded area shows our delivery coverage from Ricos Tacos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceAreaMap;
