"use client";

import { useEffect, useRef } from "react";
import { storeConfig } from "@/lib/store";

export function StoreMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let cancelled = false;

    async function initMap() {
      const L = (await import("leaflet")).default;

      if (cancelled || !mapRef.current) return;

      // Import leaflet CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const map = L.map(mapRef.current, {
        center: [storeConfig.lat, storeConfig.lng],
        zoom: 15,
        scrollWheelZoom: false,
        attributionControl: true
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      }).addTo(map);

      // Custom gold marker
      const goldIcon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #F8E08E, #D4AF37, #8A6A13);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid #080808;
          box-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
        "><span style="
          transform: rotate(45deg);
          font-size: 14px;
          font-weight: bold;
          color: #080808;
        ">S</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
      });

      L.marker([storeConfig.lat, storeConfig.lng], { icon: goldIcon })
        .addTo(map)
        .bindPopup(
          `<div style="text-align:center;font-family:sans-serif;padding:4px;">
            <strong style="font-size:14px;">${storeConfig.name}</strong><br/>
            <span style="font-size:12px;color:#666;">${storeConfig.address}</span><br/>
            <span style="font-size:12px;color:#666;">${storeConfig.phone}</span>
          </div>`
        );

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className="h-full min-h-[280px] w-full rounded-lg"
      style={{ background: "#181818" }}
    />
  );
}
