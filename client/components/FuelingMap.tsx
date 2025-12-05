import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  LayerGroup,
  Marker,
  Popup,
  useMap,
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

// Custom marker icons for different statuses
const createMarkerIcon = (status: string) => {
  let color = "#10B981"; // green (default/coming)

  if (status === "overdue") {
    color = "#EF4444"; // red
  } else if (status === "today") {
    color = "#FBBF24"; // yellow
  } else if (status === "tomorrow") {
    color = "#3B82F6"; // blue
  }

  return L.divIcon({
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <span style="
          color: white;
          font-weight: bold;
          font-size: 16px;
        ">●</span>
      </div>
    `,
    className: "custom-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Layer control component
const LayerControl = () => {
  const map = useMap();

  useEffect(() => {
    const baseLayers: { [key: string]: L.TileLayer } = {
      Street: L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }
      ),
      Satellite: L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "&copy; <a href='https://www.arcgisonline.com/'>Esri</a>",
          maxZoom: 18,
        }
      ),
      Terrain: L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "&copy; <a href='https://www.arcgisonline.com/'>Esri</a>",
          maxZoom: 18,
        }
      ),
      Dark: L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
          maxZoom: 19,
        }
      ),
    };

    // Add Street layer by default
    baseLayers["Street"].addTo(map);

    // Create layer control
    L.control.layers(baseLayers).addTo(map);

    return () => {
      map.remove();
    };
  }, [map]);

  return null;
};

export default function FuelingMap({ sites }: MapProps) {
  const [overdueGroup, setOverdueGroup] = useState<FuelingSchedule[]>([]);
  const [todayGroup, setTodayGroup] = useState<FuelingSchedule[]>([]);
  const [upcomingGroup, setUpcomingGroup] = useState<FuelingSchedule[]>([]);

  // Group sites by status
  useEffect(() => {
    setOverdueGroup(sites.filter((s) => s.status === "overdue"));
    setTodayGroup(sites.filter((s) => s.status === "today"));
    setUpcomingGroup(
      sites.filter((s) => s.status === "tomorrow" || s.status === "coming")
    );
  }, [sites]);

  // Calculate center of map (average of all site coordinates)
  const getMapCenter = (): [number, number] => {
    if (sites.length === 0) return [20, 0];

    const validSites = sites.filter((s) => s.latitude !== 0 && s.longitude !== 0);
    if (validSites.length === 0) return [20, 0];

    const avgLat =
      validSites.reduce((sum, s) => sum + s.latitude, 0) / validSites.length;
    const avgLon =
      validSites.reduce((sum, s) => sum + s.longitude, 0) / validSites.length;

    return [avgLat, avgLon];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "today":
        return "🟡 Today";
      case "tomorrow":
        return "🔵 Tomorrow";
      case "coming":
        return "🟢 Coming Soon";
      case "overdue":
        return "🔴 Overdue";
      default:
        return "⚫ Unscheduled";
    }
  };

  return (
    <MapContainer
      center={getMapCenter()}
      zoom={4}
      style={{ width: "100%", height: "100%" }}
      className="rounded-lg"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <LayerControl />

      {/* Overdue markers (Red) */}
      <LayerGroup>
        {overdueGroup.map((site) => (
          <Marker
            key={site.id}
            position={[site.latitude, site.longitude]}
            icon={createMarkerIcon("overdue")}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{site.siteName}</p>
                <p className="text-xs text-gray-600">
                  {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                </p>
                <p className="text-xs font-medium mt-1">{getStatusBadge("overdue")}</p>
                <p className="text-xs text-gray-600">
                  Scheduled: {new Date(site.scheduledDate).toLocaleDateString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </LayerGroup>

      {/* Today markers (Yellow) */}
      <LayerGroup>
        {todayGroup.map((site) => (
          <Marker
            key={site.id}
            position={[site.latitude, site.longitude]}
            icon={createMarkerIcon("today")}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{site.siteName}</p>
                <p className="text-xs text-gray-600">
                  {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                </p>
                <p className="text-xs font-medium mt-1">{getStatusBadge("today")}</p>
                <p className="text-xs text-gray-600">
                  Scheduled: {new Date(site.scheduledDate).toLocaleDateString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </LayerGroup>

      {/* Coming/Upcoming markers (Green) */}
      <LayerGroup>
        {upcomingGroup.map((site) => (
          <Marker
            key={site.id}
            position={[site.latitude, site.longitude]}
            icon={createMarkerIcon(site.status)}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{site.siteName}</p>
                <p className="text-xs text-gray-600">
                  {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                </p>
                <p className="text-xs font-medium mt-1">
                  {getStatusBadge(site.status)}
                </p>
                <p className="text-xs text-gray-600">
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
