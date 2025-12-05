import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
  LayersControl,
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
  priority: string;
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

const getStatusBadgeStyles = (
  status: string,
): { bgColor: string; textColor: string } => {
  switch (status) {
    case "overdue":
      return { bgColor: "#FEE2E2", textColor: "#991B1B" }; // Light red bg, dark red text
    case "today":
      return { bgColor: "#FEF3C7", textColor: "#92400E" }; // Light yellow bg, dark yellow text
    case "coming":
    case "incoming":
    case "tomorrow":
      return { bgColor: "#DCFCE7", textColor: "#166534" }; // Light green bg, dark green text
    default:
      return { bgColor: "#F3F4F6", textColor: "#374151" }; // Light gray bg, dark gray text
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
      <LayersControl position="bottomleft">
        <LayersControl.BaseLayer checked name="Street Map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Terrain">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Dark Map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>
      </LayersControl>
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
            {(() => {
              const badgeStyles = getStatusBadgeStyles(site.status);
              return (
                <div className="text-sm space-y-3 min-w-64">
                  <div>
                    <p className="font-bold text-gray-900 text-base mb-1">
                      {site.siteName}
                    </p>
                    <div
                      style={{
                        backgroundColor: badgeStyles.bgColor,
                        color: badgeStyles.textColor,
                      }}
                      className="inline-block px-3 py-1 rounded-full font-semibold text-xs"
                    >
                      {getStatusLabel(site.status)}
                    </div>
                  </div>
                  <hr className="border-gray-200" />
                  <div>
                    <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                      Next Fueling Date
                    </p>
                    <p className="font-semibold text-gray-900">
                      {site.nextFuelingDate
                        ? new Date(site.nextFuelingDate).toLocaleDateString(
                            "en-GB",
                          )
                        : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                      Legend Status
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        style={{
                          backgroundColor: getStatusColor(site.status),
                        }}
                        className="w-3 h-3 rounded-full"
                      />
                      <span className="text-gray-700">
                        {getStatusLabel(site.status)}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs pt-2 border-t border-gray-200">
                    {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                  </p>
                </div>
              );
            })()}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
