import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  LayerGroup,
  Marker,
  Popup,
  useMap,
  Control,
} from "react-leaflet";
import L from "leaflet";

interface FuelingSchedule {
  id: string;
  siteName: string;
  location: string;
  fuelType: string;
  scheduledDate: string;
  status: "today" | "tomorrow" | "coming" | "overdue";
  lastUpdated: string;
  latitude: number;
  longitude: number;
}

interface MapProps {
  sites: FuelingSchedule[];
}

// Create marker icon based on status
const getMarkerColor = (status: string) => {
  if (status === "overdue") return "#EF4444"; // red
  if (status === "today") return "#FBBF24"; // yellow
  if (status === "tomorrow") return "#3B82F6"; // blue
  return "#10B981"; // green
};

// Custom divIcon for markers
const createCustomMarker = (status: string) => {
  const color = getMarkerColor(status);
  const html = `
    <div style="
      width: 30px;
      height: 30px;
      background-color: ${color};
      border: 2px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      font-size: 18px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    ">●</div>
  `;

  return L.divIcon({
    html,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
    className: "custom-div-icon",
  });
};

// Layer control component
const MapLayers = () => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    try {
      const osm = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }
      );

      const satellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "© Esri",
          maxZoom: 18,
        }
      );

      const terrain = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "© Esri",
          maxZoom: 18,
        }
      );

      const dark = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }
      );

      const baseLayers = {
        Street: osm,
        Satellite: satellite,
        Terrain: terrain,
        Dark: dark,
      };

      osm.addTo(map);
      L.control.layers(baseLayers).addTo(map);
    } catch (error) {
      console.error("Error setting up map layers:", error);
    }
  }, [map]);

  return null;
};

export default function FuelingMap({ sites }: MapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]);

  // Calculate map center
  useEffect(() => {
    if (sites.length === 0) {
      setMapCenter([20, 0]);
      return;
    }

    const validSites = sites.filter((s) => s.latitude !== 0 && s.longitude !== 0);
    if (validSites.length === 0) {
      setMapCenter([20, 0]);
      return;
    }

    const avgLat =
      validSites.reduce((sum, s) => sum + s.latitude, 0) / validSites.length;
    const avgLon =
      validSites.reduce((sum, s) => sum + s.longitude, 0) / validSites.length;

    setMapCenter([avgLat, avgLon]);
  }, [sites]);

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      today: "🟡 Today",
      tomorrow: "🔵 Tomorrow",
      coming: "🟢 Coming Soon",
      overdue: "🔴 Overdue",
    };
    return labels[status] || "Unknown";
  };

  return (
    <MapContainer center={mapCenter} zoom={4} style={{ width: "100%", height: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <MapLayers />

      {/* Render all markers */}
      <LayerGroup>
        {sites.map((site) => (
          <Marker
            key={site.id}
            position={[site.latitude, site.longitude]}
            icon={createCustomMarker(site.status)}
          >
            <Popup>
              <div className="text-sm max-w-xs">
                <p className="font-semibold text-gray-900">{site.siteName}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                </p>
                <p className="text-xs font-medium text-gray-800 mt-2">
                  {getStatusLabel(site.status)}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Scheduled: {new Date(site.scheduledDate).toLocaleDateString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </LayerGroup>
    </MapContainer>
  );
}
