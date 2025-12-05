import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface FuelingSchedule {
  id: string;
  siteName: string;
  location: string;
  fuelType: string;
  scheduledDate: string;
  status: "today" | "tomorrow" | "coming" | "incoming" | "overdue";
  lastUpdated: string;
  latitude: number;
  longitude: number;
  nextFuelingDate: string;
}

interface FuelingMapProps {
  sites: FuelingSchedule[];
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case "overdue":
      return "#EF4444"; // Red
    case "today":
      return "#EACC00"; // Yellow
    case "coming":
    case "incoming":
    case "tomorrow":
      return "#22C55E"; // Green
    default:
      return "#6B7280"; // Gray
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case "overdue":
      return "DUE";
    case "today":
      return "TODAY";
    case "coming":
      return "COMING";
    case "incoming":
      return "INCOMING";
    case "tomorrow":
      return "TOMORROW";
    default:
      return "UNSCHEDULED";
  }
};

const MapLegend = () => {
  const map = useMap();

  useEffect(() => {
    const legend = L.control({ position: "topright" });

    legend.onAdd = () => {
      const div = L.DomUtil.create("div", "map-legend");
      div.style.backgroundColor = "white";
      div.style.padding = "12px";
      div.style.borderRadius = "8px";
      div.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
      div.style.fontFamily = "system-ui, -apple-system, sans-serif";
      div.style.fontSize = "12px";
      div.style.lineHeight = "1.6";
      div.style.zIndex = "1000";

      div.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px; color: #333;">Status Legend</div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <div style="width: 12px; height: 12px; background-color: #EF4444; border-radius: 50%;"></div>
          <span>Due (Overdue)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <div style="width: 12px; height: 12px; background-color: #EACC00; border-radius: 50%;"></div>
          <span>Today</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 12px; height: 12px; background-color: #22C55E; border-radius: 50%;"></div>
          <span>Upcoming</span>
        </div>
      `;

      return div;
    };

    legend.addTo(map);

    return () => {
      legend.remove();
    };
  }, [map]);

  return null;
};

export default function FuelingMap({ sites }: FuelingMapProps) {
  const [validSites, setValidSites] = useState<FuelingSchedule[]>([]);

  useEffect(() => {
    const filtered = sites.filter(
      (site) =>
        site.latitude !== 0 &&
        site.longitude !== 0 &&
        !isNaN(site.latitude) &&
        !isNaN(site.longitude),
    );
    console.log("Map sites:", filtered.length);
    const overdueOnMap = filtered.filter((s) => s.status === "overdue");
    console.log("Overdue on map:", overdueOnMap.length);
    if (overdueOnMap.length > 0) {
      console.log("Sample overdue site:", overdueOnMap[0]);
    }
    setValidSites(filtered);
  }, [sites]);

  if (validSites.length === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center rounded-xl">
        <p className="text-gray-500 text-center">
          No valid coordinates available for map display
        </p>
      </div>
    );
  }

  // Saudi Arabia bounds: [South, West] to [North, East]
  const saudiArabiaBounds: [[number, number], [number, number]] = [
    [16.3, 34.4], // Southwest corner
    [32.1, 55.6], // Northeast corner
  ];

  // Calculate center based on all sites or use Saudi Arabia center
  const centerLat =
    validSites.reduce((sum, site) => sum + site.latitude, 0) /
      validSites.length || 24.2;
  const centerLon =
    validSites.reduce((sum, site) => sum + site.longitude, 0) /
      validSites.length || 44.9;

  return (
    <MapContainer
      center={[centerLat, centerLon]}
      zoom={6}
      maxBounds={saudiArabiaBounds}
      maxBoundsViscosity={1.0}
      minZoom={5}
      maxZoom={12}
      className="w-full h-full"
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapLegend />

      {validSites.map((site) => (
        <CircleMarker
          key={site.id}
          center={[site.latitude, site.longitude]}
          radius={8}
          fillColor={getStatusColor(site.status)}
          color={getStatusColor(site.status)}
          weight={2}
          opacity={0.8}
          fillOpacity={0.9}
        >
          <Popup>
            <div className="text-sm space-y-2">
              <p className="font-bold text-gray-900">{site.siteName}</p>
              <p className="text-gray-700">
                <span className="font-semibold">Status:</span>{" "}
                <span>{getStatusLabel(site.status)}</span>
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Scheduled:</span>{" "}
                {new Date(site.scheduledDate).toLocaleDateString("en-GB")}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Next Fueling:</span>{" "}
                {site.nextFuelingDate
                  ? new Date(site.nextFuelingDate).toLocaleDateString("en-GB")
                  : "Not set"}
              </p>
              <p className="text-gray-500 text-xs">
                {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
