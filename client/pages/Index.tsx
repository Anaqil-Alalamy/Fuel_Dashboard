import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Fuel,
  AlertCircle,
  TrendingUp,
  Download,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRDnTkwpbgsnY_i60u3ZleNs1DL3vMdG3fYHMrr5rwVDqMb3GpgKH40Y-7WQsEzEAi-wDHwLaimN8NC/pub?gid=1871402380&single=true&output=csv";

const parseDateDDMMYYYY = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.trim().split("/");
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month - 1, day);
};

const determineStatus = (
  scheduledDate: Date,
): "today" | "tomorrow" | "coming" | "overdue" => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const threeFromNow = new Date(today);
  threeFromNow.setDate(threeFromNow.getDate() + 3);

  const scheduled = new Date(scheduledDate);
  scheduled.setHours(0, 0, 0, 0);

  if (scheduled.getTime() === today.getTime()) return "today";
  if (scheduled.getTime() === tomorrow.getTime()) return "tomorrow";
  if (scheduled > today && scheduled <= threeFromNow) return "coming";
  if (scheduled < today) return "overdue";
  return "coming";
};

const fetchFuelingData = async (): Promise<FuelingSchedule[]> => {
  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const csv = await response.text();

    const lines = csv.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const sites: FuelingSchedule[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());

      const siteName = values[0];
      if (!siteName) continue;

      const latStr = values[5] || "0";
      const lonStr = values[6] || "0";
      let latitude = parseFloat(latStr);
      let longitude = parseFloat(lonStr);

      if (isNaN(latitude)) latitude = 0;
      if (isNaN(longitude)) longitude = 0;

      const dateStr = values[13] || "";
      let parsedDate = dateStr ? parseDateDDMMYYYY(dateStr) : null;
      if (!parsedDate) {
        parsedDate = new Date();
      }

      const status = determineStatus(parsedDate);
      const scheduledDateISO = parsedDate.toISOString().split("T")[0];

      sites.push({
        id: `${siteName.replace(/\s+/g, "_")}_${i}`,
        siteName,
        location: siteName,
        fuelType: "Fuel",
        scheduledDate: scheduledDateISO,
        status,
        lastUpdated: new Date().toISOString(),
        latitude,
        longitude,
      });
    }

    return sites;
  } catch (error) {
    console.error("Error fetching fueling data:", error);
    return [];
  }
};

const getStatusBorderColor = (status: string): string => {
  switch (status) {
    case "overdue":
      return "border-t-4 border-t-red-500";
    case "today":
      return "border-t-4 border-t-orange-500";
    case "coming":
      return "border-t-4 border-t-yellow-500";
    default:
      return "border-t-4 border-t-gray-300";
  }
};

const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case "today":
      return "bg-orange-100 text-orange-700";
    case "tomorrow":
      return "bg-blue-100 text-blue-700";
    case "coming":
      return "bg-yellow-100 text-yellow-700";
    case "overdue":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "today":
      return "🟠";
    case "tomorrow":
      return "🔵";
    case "coming":
      return "🟡";
    case "overdue":
      return "🔴";
    default:
      return "⚫";
  }
};

const StatusPanel = ({
  title,
  borderColor,
  sites,
  icon,
}: {
  title: string;
  borderColor: string;
  sites: FuelingSchedule[];
  icon: string;
}) => {
  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-sm overflow-hidden flex flex-col",
        borderColor,
      )}
    >
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <span>{icon}</span>
          {title}
          <span className="ml-auto text-xs bg-gray-200 text-gray-700 rounded-full px-2 py-0.5">
            {sites.length}
          </span>
        </h3>
      </div>

      {sites.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-gray-500">No sites</p>
        </div>
      ) : (
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">
                  Site Name
                </th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sites.map((site) => (
                <tr
                  key={site.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-3 py-2 text-gray-900 font-medium truncate max-w-[150px]">
                    {site.siteName}
                  </td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                    {new Date(site.scheduledDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const KPICard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ size: number; className?: string }>;
  color: string;
}) => (
  <div className="bg-white rounded-[14px] border border-[#E0E4E8] shadow-sm p-4">
    <div className="flex items-start justify-between mb-3">
      <h3 className="text-xs text-gray-600 font-medium">{title}</h3>
      <Icon size={18} className={color} />
    </div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    <p className="text-xs text-gray-500 mt-1">Active</p>
  </div>
);

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [sites, setSites] = useState<FuelingSchedule[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchFuelingData();
      setSites(data);
      setLastUpdateTime(new Date());
    };
    loadData();
  }, []);

  const filteredSites = sites.filter(
    (site) =>
      site.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.location.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const overdueSites = filteredSites.filter((s) => s.status === "overdue");
  const todaySites = filteredSites.filter((s) => s.status === "today");
  const comingSites = filteredSites.filter(
    (s) => s.status === "coming" || s.status === "tomorrow",
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    const data = await fetchFuelingData();
    setSites(data);
    setLastUpdateTime(new Date());
    setRefreshing(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  const currentDateTime = new Date().toLocaleString("en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 md:px-6 py-3 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Date/Time and Title */}
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar size={16} className="text-gray-500" />
                <span className="font-medium">{currentDateTime}</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 md:flex-none md:w-64">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <Input
                  placeholder="Search sites..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 text-sm border-gray-200"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download size={16} />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 md:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard
              title="Total Sites"
              value={sites.length}
              icon={MapPin}
              color="text-blue-600"
            />
            <KPICard
              title="Overdue"
              value={sites.filter((s) => s.status === "overdue").length}
              icon={AlertCircle}
              color="text-red-600"
            />
            <KPICard
              title="Today"
              value={sites.filter((s) => s.status === "today").length}
              icon={Clock}
              color="text-orange-600"
            />
            <KPICard
              title="Coming (3D)"
              value={
                sites.filter(
                  (s) => s.status === "coming" || s.status === "tomorrow",
                ).length
              }
              icon={TrendingUp}
              color="text-green-600"
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-6">
            {/* Left Column - Status Panels */}
            <div className="flex flex-col gap-4">
              {/* Overdue Panel */}
              <StatusPanel
                title="Overdue"
                borderColor="border-t-red-500"
                sites={overdueSites}
                icon="🔴"
              />

              {/* Today Panel */}
              <StatusPanel
                title="Today"
                borderColor="border-t-orange-500"
                sites={todaySites}
                icon="🟠"
              />

              {/* Coming Panel */}
              <StatusPanel
                title="Coming (3D)"
                borderColor="border-t-yellow-500"
                sites={comingSites}
                icon="🟡"
              />
            </div>

            {/* Right Column - Map Container */}
            <div className="flex flex-col gap-4">
              {/* Map Container with Double Borders */}
              <div className="border-[3px] border-blue-900 rounded-lg shadow-lg p-0.5 overflow-hidden flex-1">
                <div className="border-2 border-red-500 rounded-md h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center min-h-[400px] md:min-h-[600px]">
                  <div className="text-center px-6">
                    <MapPin className="mx-auto text-gray-400 mb-4" size={56} />
                    <p className="text-gray-700 font-semibold text-lg mb-2">
                      Interactive Site Map
                    </p>
                    <p className="text-gray-600 text-sm mb-4">
                      Showing {sites.length} fueling sites
                    </p>
                    <p className="text-gray-500 text-xs mb-6">
                      Map visualization powered by Leaflet
                    </p>

                    {/* Legend */}
                    <div className="bg-white border border-gray-300 rounded-lg p-3 text-left inline-block shadow-sm">
                      <p className="text-xs font-semibold text-gray-700 mb-3">
                        Status Legend
                      </p>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🔴</span>
                          <span className="text-gray-700">
                            Overdue ({overdueSites.length})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🟠</span>
                          <span className="text-gray-700">
                            Today ({todaySites.length})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🟡</span>
                          <span className="text-gray-700">
                            Coming ({comingSites.length})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Footer */}
              <div className="text-xs text-gray-600 text-center py-2">
                <p>Last updated: {lastUpdateTime.toLocaleTimeString()}</p>
                <p>Auto-refreshes every 2 minutes</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
