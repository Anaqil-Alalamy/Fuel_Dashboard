import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FuelingMap from "@/components/FuelingMap";
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
  ArrowUpRight,
  Zap,
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
  nextFuelingDate: string;
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
    if (!response.ok) {
      console.error(`HTTP Error: ${response.status}`);
      throw new Error(`HTTP ${response.status}`);
    }

    const csv = await response.text();
    console.log("CSV fetched, length:", csv.length);

    const lines = csv.split("\n").filter((line) => line.trim());
    console.log("Total lines parsed:", lines.length);

    if (lines.length < 2) {
      console.warn("CSV has no data rows");
      return [];
    }

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

      // Column N (index 13) is NextfuelingPlan
      const nextFuelingStr = values[13] || "";
      let nextFuelingDate = nextFuelingStr;
      if (nextFuelingStr) {
        const nextFuelingParsed = parseDateDDMMYYYY(nextFuelingStr);
        if (nextFuelingParsed) {
          nextFuelingDate = nextFuelingParsed.toISOString().split("T")[0];
        }
      }

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
        nextFuelingDate,
      });
    }

    console.log("Sites loaded:", sites.length);
    return sites;
  } catch (error) {
    console.error("Error fetching fueling data:", error);
    return [];
  }
};

const StatusPanel = ({
  title,
  borderColor,
  sites,
  icon,
  gradient,
}: {
  title: string;
  borderColor: string;
  sites: FuelingSchedule[];
  icon: string;
  gradient: string;
}) => {
  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-lg overflow-hidden flex flex-col border border-gray-200",
        borderColor,
      )}
    >
      <div className={cn("px-4 py-3 bg-gradient-to-r", gradient)}>
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          {title}
          <span className="ml-auto text-xs bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 font-semibold">
            {sites.length}
          </span>
        </h3>
      </div>

      {sites.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-gray-400">No sites</p>
        </div>
      ) : (
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 py-2 font-bold text-gray-700">
                  Site Name
                </th>
                <th className="text-left px-3 py-2 font-bold text-gray-700">
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
                  <td className="px-3 py-2 text-gray-800 font-medium truncate max-w-[150px]">
                    {site.siteName}
                  </td>
                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
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
  gradient,
  trend,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ size: number; className?: string }>;
  color: string;
  gradient: string;
  trend?: number;
}) => (
  <div
    className={cn(
      "relative rounded-lg overflow-hidden shadow border border-gray-200",
      "bg-gradient-to-br",
      gradient,
    )}
  >
    <div className="absolute inset-0 opacity-10"></div>
    <div className="relative p-3">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-gray-600 text-[10px] font-medium mb-0.5">{title}</p>
          <h3 className="text-lg font-bold text-gray-900 leading-tight">{value}</h3>
        </div>
        <div className={cn("p-1.5 rounded-lg", color)}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-0.5 text-green-600 text-[9px] font-semibold">
          <ArrowUpRight size={10} />
          <span>{trend}% from yesterday</span>
        </div>
      )}
    </div>
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

  const showSearchPopup = searchTerm.trim().length > 0;

  // Always filter by status from the full sites array to show all status panels
  const overdueSites = sites.filter((s) => s.status === "overdue");
  const todaySites = sites.filter((s) => s.status === "today");
  const comingSites = sites.filter(
    (s) => s.status === "coming" || s.status === "tomorrow",
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const data = await fetchFuelingData();
    setSites(data);
    setLastUpdateTime(new Date());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 120000);
    return () => clearInterval(interval);
  }, [handleRefresh]);

  const currentDateTime = new Date().toLocaleString("en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const onSchedulePercentage =
    sites.length > 0
      ? Math.round(
          (sites.filter((s) => s.status !== "overdue").length / sites.length) *
            100,
        )
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-white to-blue-50 border-b border-blue-200 shadow-lg backdrop-blur-sm bg-opacity-90">
        {/* First row: Logo, Title, Date/Time */}
        <div className="px-4 md:px-6 py-2 md:py-3 border-b border-blue-200">
          <div className="flex items-center justify-between gap-4">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fbd65b3cd7a86452e803a3d7dc7a3d048%2F5e321b77d52a4d30b523674ca83ee1d4?format=webp&width=800"
                alt="GSM Fueling Logo"
                className="h-10 md:h-12 w-auto"
              />
              <div className="hidden md:flex items-center gap-2">
                <Fuel className="text-blue-600" size={22} />
                <h1 className="text-xl font-bold text-gray-900">Fuel Dashboard</h1>
              </div>
            </div>

            {/* Date/Time and Stats */}
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <Calendar size={16} className="text-blue-600" />
                <span className="hidden sm:inline">{currentDateTime}</span>
              </div>
              <div className="hidden md:flex items-center gap-2 pl-4 border-l border-blue-200">
                <Zap size={16} className="text-orange-500" />
                <span className="text-xs text-gray-600">
                  {onSchedulePercentage}% On Schedule
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Second row: Search Bar, Refresh, Download (right-aligned) */}
        <div className="px-4 md:px-6 py-2 md:py-3">
          <div className="flex items-center justify-end gap-3">
            {/* Search Bar */}
            <div className="flex-1 md:flex-none md:w-64 relative">
              <div className="relative group">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors"
                  size={16}
                />
                <Input
                  placeholder="Search sites..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 text-sm border-blue-200 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:ring-blue-600 focus:ring-opacity-20"
                />

                {/* Search Results Popup */}
                {showSearchPopup && filteredSites.length > 0 && (
                  <div className="absolute top-full right-0 mt-2 bg-white border border-blue-300 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto w-80">
                    <div className="p-3">
                      <p className="text-xs font-bold text-gray-600 mb-2">
                        Found {filteredSites.length} site{filteredSites.length !== 1 ? "s" : ""}
                      </p>
                      <div className="space-y-2">
                        {filteredSites.map((site) => (
                          <div
                            key={site.id}
                            className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:border-blue-400 transition-colors"
                          >
                            <p className="font-bold text-gray-900 text-sm">{site.siteName}</p>
                            <div className="mt-2 space-y-1 text-xs">
                              <p className="text-gray-700">
                                <span className="font-semibold">Next Fueling:</span>{" "}
                                {site.nextFuelingDate
                                  ? new Date(site.nextFuelingDate).toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "Not set"}
                              </p>
                              <p className="text-gray-600">
                                <span className="font-semibold">Status:</span>{" "}
                                {site.status === "overdue"
                                  ? "🔴 Overdue"
                                  : site.status === "today"
                                    ? "🟠 Today"
                                    : site.status === "coming"
                                      ? "🟡 Coming"
                                      : "🟢 Tomorrow"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* No Results Message */}
                {showSearchPopup && filteredSites.length === 0 && (
                  <div className="absolute top-full right-0 mt-2 bg-white border border-yellow-300 rounded-lg shadow-xl z-50 p-3 w-80">
                    <p className="text-sm text-gray-600 text-center">
                      No sites found matching "{searchTerm}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="gap-2 border-blue-300 bg-blue-50 text-gray-700 hover:bg-blue-100 hover:text-gray-900"
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing ? "animate-spin text-blue-600" : "text-blue-600"
                  }
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-blue-300 bg-blue-50 text-gray-700 hover:bg-blue-100 hover:text-gray-900"
              >
                <Download size={16} className="text-blue-600" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 md:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Fuel className="text-blue-600" size={28} />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Fuel Dashboard
              </h1>
            </div>
            <p className="text-gray-600 text-sm">
              Real-time monitoring of {sites.length} GSM fueling sites
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
            <KPICard
              title="Total Sites"
              value={sites.length}
              icon={MapPin}
              color="bg-blue-600"
              gradient="from-blue-100 to-blue-200"
              trend={12}
            />
            <KPICard
              title="Overdue"
              value={sites.filter((s) => s.status === "overdue").length}
              icon={AlertCircle}
              color="bg-red-600"
              gradient="from-red-100 to-red-200"
            />
            <KPICard
              title="Today"
              value={sites.filter((s) => s.status === "today").length}
              icon={Clock}
              color="bg-orange-600"
              gradient="from-orange-100 to-orange-200"
            />
            <KPICard
              title="Coming (3D)"
              value={
                sites.filter(
                  (s) => s.status === "coming" || s.status === "tomorrow",
                ).length
              }
              icon={TrendingUp}
              color="bg-green-600"
              gradient="from-green-100 to-green-200"
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-6 min-h-screen">
            {/* Left Column - Status Panels (Scrollable) */}
            <div className="flex flex-col gap-4 overflow-y-auto pr-2 max-h-[calc(100vh-200px)]">
              {/* Overdue Panel */}
              <StatusPanel
                title="Overdue"
                borderColor="border-t-2 border-t-red-500"
                sites={overdueSites}
                icon="🔴"
                gradient="from-red-100 to-red-200"
              />

              {/* Today Panel */}
              <StatusPanel
                title="Today"
                borderColor="border-t-2 border-t-orange-500"
                sites={todaySites}
                icon="🟠"
                gradient="from-orange-100 to-orange-200"
              />

              {/* Coming Panel */}
              <StatusPanel
                title="Coming (3D)"
                borderColor="border-t-2 border-t-yellow-500"
                sites={comingSites}
                icon="🟡"
                gradient="from-yellow-100 to-yellow-200"
              />
            </div>

            {/* Right Column - Map Container (Sticky) */}
            <div
              className="sticky top-[140px] flex flex-col gap-4"
              style={{ height: "calc(100vh - 180px)" }}
            >
              {/* Map Container with Double Borders */}
              <div className="border-4 border-blue-600 rounded-2xl shadow-xl p-1 overflow-hidden flex-1 flex flex-col">
                <div className="border-2 border-red-500 rounded-xl h-full overflow-hidden flex-1">
                  <FuelingMap sites={sites} />
                </div>
              </div>

              {/* Legend and Footer */}
              <div className="flex flex-col gap-3">
                <div className="bg-white border border-gray-300 rounded-xl p-3 shadow-lg">
                  <p className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Zap size={12} className="text-orange-500" />
                    Status Legend
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>Overdue: {overdueSites.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <span>Today: {todaySites.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Coming: {comingSites.length}</span>
                    </div>
                  </div>
                </div>

                {/* Info Footer */}
                <div className="text-xs text-gray-600 text-center py-1 px-3 bg-gradient-to-r from-white to-blue-50 rounded-lg border border-gray-200">
                  <p className="font-medium">
                    Last updated: {lastUpdateTime.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
