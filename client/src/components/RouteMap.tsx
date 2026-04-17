'use client';

import { useEffect, useRef } from 'react';
import type { DayRoute } from '@/types';

interface RouteMapProps {
  routes: DayRoute[];
  tripType?: 'bicycle' | 'trek';
  height?: string;
  highlightDay?: number | null;
}

/**
 * RouteMap Component
 *
 * Displays hiking/cycling routes on an interactive Leaflet map using landmarks.
 * Uses Leaflet Routing Machine for realistic routes on roads/trails.
 *
 * @param routes - Array of day routes to display
 * @param height - Map container height (default: 500px)
 */
export default function RouteMap({ routes, tripType, height = '500px', highlightDay }: RouteMapProps) {
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const routeLayersRef = useRef<Map<number, any>>(new Map());
  const routingControlsRef = useRef<any[]>([]);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !mapRef.current) return;

    let mounted = true;

    // Dynamic import of Leaflet
    const initMap = async () => {
      const L = (await import('leaflet')).default;

      // Import Leaflet Routing Machine
      await import('leaflet-routing-machine');

      // Abort if component unmounted during async import
      if (!mounted) return;

      // Fix marker icon issue in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // If map already exists, clean up routing controls first then remove map
      if (mapInstanceRef.current) {
        routingControlsRef.current.forEach(ctrl => {
          try { ctrl.remove(); } catch {}
        });
        routingControlsRef.current = [];
        mapInstanceRef.current.remove();
      }

      if (!routes || routes.length === 0) {
        console.log('RouteMap: No routes provided');
        return;
      }

      console.log('RouteMap: Rendering', routes.length, 'routes with landmarks');

      // Find first landmark with coordinates for initial map center
      let initialLat = 46.2044; // Default: Geneva
      let initialLng = 6.1432;
      let foundEntryPoint = false;

      for (const route of routes) {
        if (route.majorLandmarks && route.majorLandmarks.length > 0) {
          const firstLandmark = route.majorLandmarks[0];
          if (firstLandmark.lat && firstLandmark.lng) {
            initialLat = firstLandmark.lat;
            initialLng = firstLandmark.lng;
            foundEntryPoint = true;
            console.log(`Map centering on entry point: ${firstLandmark.name}`);
            break;
          }
        }
      }

      // Initialize map centered on entry point
      const map = L.map(mapRef.current).setView([initialLat, initialLng], foundEntryPoint ? 14 : 10);
      mapInstanceRef.current = map;

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Color palette for different days
      const colors = [
        '#2d5a27', '#8b5a2b', '#3b82f6', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4',
        '#84cc16', '#a855f7', '#10b981', '#f43f5e', '#6366f1',
        '#eab308', '#22c55e', '#db2777', '#0ea5e9', '#d97706',
        '#7c3aed', '#059669', '#be123c', '#0284c7', '#ca8a04',
        '#16a34a', '#9333ea', '#dc2626', '#0891b2', '#65a30d',
      ];
      console.log('Color palette loaded:', `${colors.length} colors for up to ${colors.length} days`);

      const allCoords: [number, number][] = [];

      // Draw each day's route
      routes.forEach((route, routeIndex) => {
        console.log(`Drawing route ${routeIndex + 1} (Day ${route.day}):`);

        const color = colors[routeIndex % colors.length];
        const landmarks = route.majorLandmarks || [];

        console.log(`   Using color: ${color} (day ${route.day})`);

        // Filter landmarks that have valid coordinates
        const validLandmarks = landmarks.filter(l =>
          l.lat !== undefined &&
          l.lng !== undefined &&
          !isNaN(l.lat) &&
          !isNaN(l.lng)
        );

        if (validLandmarks.length === 0) {
          console.warn(`Route ${routeIndex + 1}: No landmarks with valid coordinates`);
          return;
        }

        console.log(`   Found ${validLandmarks.length} valid landmarks`);

        // Create numbered markers for each landmark
        validLandmarks.forEach((landmark, landmarkIndex) => {
          const lat = landmark.lat!;
          const lng = landmark.lng!;

          allCoords.push([lat, lng]);

          // Create custom numbered icon
          const numberIcon = L.divIcon({
            className: 'custom-number-icon',
            html: `
              <div class="route-marker-circle" style="
                background-color: ${color};
                border: 3px solid white;
                border-radius: 50%;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 16px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                line-height: 1;
                text-align: center;
              ">
                <span style="display: block; position: relative; z-index: 10;">${landmarkIndex + 1}</span>
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });

          // Add marker
          const marker = L.marker([lat, lng], {
            icon: numberIcon,
            title: landmark.name,
          }).addTo(map);

          // Add popup with landmark info
          marker.bindPopup(`
            <div style="min-width: 200px;">
              <strong style="color: ${color};">Day ${route.day} - Stop ${landmarkIndex + 1}</strong><br/>
              <strong>${landmark.name}</strong><br/>
              ${landmark.description ? `<em>${landmark.description}</em><br/>` : ''}
              <small>Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}</small>
            </div>
          `);

          console.log(`   Marker ${landmarkIndex + 1}: ${landmark.name}`);
        });

        // Draw realistic routes between landmarks using Leaflet Routing Machine
        if (validLandmarks.length >= 2) {
          const waypoints = validLandmarks.map(l => L.latLng(l.lat!, l.lng!));

          try {
            const routingControl = (L as any).Routing.control({
              waypoints,
              router: (L as any).Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1',
                profile: tripType?.toLowerCase() === 'bicycle' ? 'bike' : 'foot',
                suppressDemoServerWarning: true,
              }),
              errorHandler: function(error: any) {
                console.warn(`Routing service error for route ${routeIndex + 1}:`, error);
              },
              createMarker: function() { return false; },
              lineOptions: {
                styles: [{ color, weight: 4, opacity: 0.7 }]
              },
              show: false,
              addWaypoints: false,
              routeWhileDragging: false,
              fitSelectedRoutes: false,
              collapsible: false,
            }).addTo(map);

            routingControlsRef.current.push(routingControl);
            console.log(`   Routing control created for route ${routeIndex + 1}`);

            routingControl.on('routesfound', function(e: any) {
              const routes = e.routes;
              if (routes && routes.length > 0) {
                const summary = routes[0].summary;
                const totalDistance = (summary.totalDistance / 1000).toFixed(2);
                const totalTime = Math.round(summary.totalTime / 60);

                console.log(`   Realistic route calculated: ${totalDistance} km, ~${totalTime} min`);
              }
            });

            routingControl.on('routingerror', function(e: any) {
              console.warn(`ROUTING ERROR for route ${routeIndex + 1}:`, e);
              console.log(`   Waypoints are visible, but route line could not be drawn`);
            });

            console.log(`   Realistic route connecting ${validLandmarks.length} landmarks (using OSRM)`);
          } catch (error) {
            console.log(`   Note: Route line not available for route ${routeIndex + 1} (waypoints visible)`);
          }
        }
      });

      // Fit map to show all landmarks
      if (allCoords.length > 0) {
        if (foundEntryPoint) {
          console.log(`Map zoomed to entry point at zoom level 14`);
        } else {
          const bounds = L.latLngBounds(allCoords);
          map.fitBounds(bounds, { padding: [50, 50] });
          console.log(`Map fitted to ${allCoords.length} landmark coordinates`);
        }
      } else {
        console.warn('No coordinates available for map bounds');
      }
    };

    initMap();

    // Cleanup
    return () => {
      mounted = false;
      routingControlsRef.current.forEach(ctrl => {
        try { ctrl.remove(); } catch {}
      });
      routingControlsRef.current = [];
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [routes, tripType]);

  // Zoom to highlighted day when it changes
  useEffect(() => {
    if (!mapInstanceRef.current || !highlightDay) return;

    const L = require('leaflet');
    const map = mapInstanceRef.current;
    const route = routes.find(r => r.day === highlightDay);

    if (!route || !route.majorLandmarks) return;

    const dayCoords = route.majorLandmarks
      .filter(l => l.lat && l.lng)
      .map(l => [l.lat!, l.lng!] as [number, number]);

    if (dayCoords.length > 0) {
      if (dayCoords.length === 1) {
        map.setView(dayCoords[0], 15, {
          animate: true,
          duration: 1
        });
      } else {
        const bounds = L.latLngBounds(dayCoords);
        map.fitBounds(bounds, {
          padding: [80, 80],
          maxZoom: 14,
          animate: true,
          duration: 1
        });
      }

      console.log(`Zoomed to Day ${highlightDay} route`);
    }
  }, [highlightDay, routes]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%', borderRadius: '0.5rem' }}
      className="leaflet-container"
    />
  );
}
