import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FuelingMap from "@/components/FuelingMap";
import { useNavigate } from "react-router-dom";
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
  X,
  LogOut,
} from "lucide-react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface FuelingSchedule {
  id: string;
  siteName: string;
  location: string;
  fuelType: string;
  scheduledDate: string;
  status: "overdue" | "today" | "tomorrow" | "incoming" | "coming";
  lastUpdated: string;
  latitude: number;
  longitude: number;
  nextFuelingDate: string;
  priority: string;
}

const SHEET_URL = "/api/sheet";
const GOOGLE_SHEETS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRDnTkwpbgsnY_i60u3ZleNs1DL3vMdG3fYHMrr5rwVDqMb3GpgKH40Y-7WQsEzEAi-wDHwLaimN8NC/pub?gid=1871402380&single=true&output=csv";

const parseDateDDMMYYYY = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.trim().split("/");
  if (parts.length !== 3) return null;
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(Date.UTC(year, month - 1, day));
};

const getDateWithoutTime = (date: Date): Date => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const getDaysDifference = (date: Date, baseDate: Date = new Date()): number => {
  const d1 = getDateWithoutTime(date);
  // Adjust for GMT+3 timezone
  const adjustedBase = new Date(baseDate);
  adjustedBase.setHours(adjustedBase.getHours() + 3);
  const utcDate = new Date(
    Date.UTC(
      adjustedBase.getUTCFullYear(),
      adjustedBase.getUTCMonth(),
      adjustedBase.getUTCDate(),
    ),
  );
  const d2 = getDateWithoutTime(utcDate);
  return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
};

const determineStatus = (
  scheduledDate: Date,
): "overdue" | "today" | "tomorrow" | "incoming" | "coming" => {
  const daysDiff = getDaysDifference(scheduledDate);

  if (daysDiff < 0) return "overdue";
  if (daysDiff === 0) return "today";
  if (daysDiff === 1) return "tomorrow";
  if (daysDiff >= 2 && daysDiff <= 4) return "incoming";
  return "coming";
};

const fetchFuelingData = async (): Promise<FuelingSchedule[]> => {
  let csv: string = "";

  // Try Google Sheets CSV first (more reliable)
  try {
    console.log("Attempting to fetch from Google Sheets CSV...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(GOOGLE_SHEETS_CSV_URL, {
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} from Google Sheets`);
      }

      csv = await response.text();
      console.log(
        "Successfully fetched from Google Sheets CSV, received",
        csv.length,
        "bytes",
      );
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (sheetError) {
    console.warn("Google Sheets fetch failed, trying local API:", sheetError);

    // Fallback to local API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch(SHEET_URL, {
          signal: controller.signal,
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} from local API`);
        }

        csv = await response.text();
        console.log(
          "Successfully fetched from local API, received",
          csv.length,
          "bytes",
        );
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (apiError) {
      console.error("Failed to fetch from both sources:", {
        sheetError,
        apiError,
      });
      // Return empty array but don't break the app
      return [];
    }
  }

  if (!csv || csv.length === 0) {
    console.warn("No CSV data received");
    return [];
  }

  const lines = csv.split("\n").filter((line) => line.trim());

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

    // Column O (index 14) is Priority
    const priority = values[14] || "";

    if (i <= 10 && priority.trim()) {
      console.log(`Row ${i}: ${siteName}, Priority: "${priority}"`);
    }

    // Column N (index 13) is NextfuelingPlan
    const nextFuelingStr = values[13] || "";
    let parsedDate = nextFuelingStr ? parseDateDDMMYYYY(nextFuelingStr) : null;
    if (!parsedDate) {
      parsedDate = new Date();
    }

    const status = determineStatus(parsedDate);
    const scheduledDateISO = parsedDate.toISOString().split("T")[0];

    // Column N (index 13) is NextfuelingPlan
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
      priority,
    });
  }

  return sites;
};

const PerformanceChart = ({ sites }: { sites: FuelingSchedule[] }) => {
  const totalSites = sites.length;
  const dueSites = sites.filter((s) => s.status === "overdue").length;
  const healthySites = totalSites - dueSites;
  const performancePercentage =
    totalSites > 0 ? Math.round((healthySites / totalSites) * 100) : 0;

  const data = [
    {
      name: "Healthy",
      value: healthySites,
      color: "#10B981",
    },
    {
      name: "Due",
      value: dueSites,
      color: "#EF4444",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-3">
      <div
        style={{
          height: "150px",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value} sites`} />
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div className="text-3xl font-bold text-blue-600">
            {performancePercentage}%
          </div>
        </div>
      </div>
      <div className="text-center mt-3">
        <p className="text-sm font-bold text-gray-900">Overall Performance</p>
      </div>
    </div>
  );
};

const getRowHighlightColor = (nextFuelingDate: string): string => {
  if (!nextFuelingDate) return "bg-gray-50";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fuelingDate = new Date(nextFuelingDate);
  fuelingDate.setHours(0, 0, 0, 0);

  const daysRemaining = Math.floor(
    (fuelingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysRemaining < 0) {
    return "bg-red-50 hover:bg-red-100"; // Overdue - Red
  } else if (daysRemaining === 0) {
    return "bg-yellow-50 hover:bg-yellow-100"; // Today - Yellow
  } else if (daysRemaining <= 3) {
    return "bg-orange-50 hover:bg-orange-100"; // 1-3 days - Orange
  } else if (daysRemaining <= 7) {
    return "bg-lime-50 hover:bg-lime-100"; // 4-7 days - Light Green
  } else {
    return "bg-green-50 hover:bg-green-100"; // 8+ days - Green
  }
};

const StatusCard = ({
  title,
  borderColor,
  sites,
  icon,
  gradient,
  onClick,
}: {
  title: string;
  borderColor: string;
  sites: FuelingSchedule[];
  icon: string;
  gradient: string;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left w-full bg-white rounded-xl shadow-lg overflow-hidden border-t-2 border-gray-200 hover:shadow-xl hover:scale-105 transition-all",
        borderColor,
      )}
    >
      <div className={cn("px-3 py-2 bg-gradient-to-r", gradient)}>
        <div className="flex flex-col items-center justify-center gap-1">
          <h3 className="text-lg font-bold text-gray-900 text-center">
            {title}
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {sites.length} {sites.length === 1 ? "site" : "sites"}
          </p>
        </div>
      </div>
    </button>
  );
};

const DetailModal = ({
  title,
  sites,
  icon,
  gradient,
  onClose,
}: {
  title: string;
  sites: FuelingSchedule[];
  icon: string;
  gradient: string;
  onClose: () => void;
}) => {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={cn(
            "px-6 py-4 bg-gradient-to-r flex items-center gap-3 justify-between",
            gradient,
          )}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <span className="ml-auto text-xs bg-white/30 text-gray-900 rounded-full px-3 py-1 font-semibold">
              {sites.length} {sites.length === 1 ? "site" : "sites"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-900 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {sites.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-400">No sites</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 font-bold text-gray-700">
                    Site Name
                  </th>
                  <th className="text-left px-6 py-3 font-bold text-gray-700">
                    Next Fueling Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sites.map((site) => (
                  <tr
                    key={site.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-3 text-gray-800 font-medium">
                      {site.siteName}
                    </td>
                    <td className="px-6 py-3 text-gray-700">
                      {site.nextFuelingDate
                        ? (() => {
                            const date = new Date(site.nextFuelingDate);
                            date.setHours(date.getHours() + 3);
                            const day = String(date.getDate()).padStart(2, "0");
                            const month = String(date.getMonth() + 1).padStart(
                              2,
                              "0",
                            );
                            const year = date.getFullYear();
                            return `${day}/${month}/${year}`;
                          })()
                        : "Not set"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
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
  borderColor,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ size: number; className?: string }>;
  color: string;
  gradient: string;
  trend?: number;
  borderColor?: string;
}) => (
  <div
    className={cn(
      "relative rounded-lg overflow-hidden shadow border-2",
      "bg-gradient-to-br",
      gradient,
      borderColor || "border-gray-200",
    )}
  >
    <div className="absolute inset-0 opacity-10"></div>
    <div className="relative p-2">
      <div className="text-center mb-1">
        <p className="text-gray-600 text-sm font-bold mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 leading-tight">
          {value}
        </h3>
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
  const [modalState, setModalState] = useState<{
    open: boolean;
    type:
      | "overdue"
      | "today"
      | "tomorrow"
      | "incoming"
      | "coming"
      | "vvvip"
      | null;
  }>({
    open: false,
    type: null,
  });

  const openModal = (
    type: "overdue" | "today" | "tomorrow" | "incoming" | "coming" | "vvvip",
  ) => {
    setModalState({ open: true, type });
  };

  const closeModal = () => {
    setModalState({ open: false, type: null });
  };

  useEffect(() => {
    // Force close any modal on page load and log for debugging
    console.log("🔍 Index page mounted, initializing...");
    setModalState({ open: false, type: null });
    console.log("🔍 Modal state reset to:", { open: false, type: null });

    const loadData = async () => {
      try {
        const data = await fetchFuelingData();
        setSites(data);
        setLastUpdateTime(new Date());
        console.log("✅ Data loaded successfully:", data.length, "sites");
      } catch (error) {
        console.error("❌ Failed to load data:", error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    console.log("🔍 Modal state changed:", {
      open: modalState.open,
      type: modalState.type,
    });
  }, [modalState]);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        console.log("⌨️ Escape key pressed, closing modal");
        setModalState({ open: false, type: null });
      }
    };
    window.addEventListener("keydown", handleEscapeKey);
    return () => window.removeEventListener("keydown", handleEscapeKey);
  }, []);

  const filteredSites = sites.filter(
    (site) =>
      site.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.location.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const showSearchPopup = searchTerm.trim().length > 0;

  // Filter sites by status from the full sites array
  const dueSites = sites.filter((s) => s.status === "overdue");
  const todaySites = sites.filter((s) => s.status === "today");
  const tomorrowSites = sites.filter((s) => s.status === "tomorrow");
  const incomingSites = sites.filter((s) => s.status === "incoming");
  const comingSites = sites.filter((s) => s.status === "coming");
  const vvvipSites = sites.filter(
    (s) => s.priority.trim().toUpperCase() === "VVVIP",
  );

  const handleDownloadExcel = () => {
    const formatDateWithTimezone = (dateStr: string): string => {
      if (!dateStr) return "Not set";
      const date = new Date(dateStr);
      // Adjust for GMT+3 timezone
      date.setHours(date.getHours() + 3);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const data = sites.map((site) => ({
      "Site Name": site.siteName,
      "Next Fueling Date": formatDateWithTimezone(site.nextFuelingDate),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sites");

    worksheet["!cols"] = [{ wch: 25 }, { wch: 18 }];

    XLSX.writeFile(
      workbook,
      `GSM_Sites_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 pointer-events-auto">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-white to-blue-50 border-b border-blue-200 shadow-lg backdrop-blur-sm bg-opacity-90 pointer-events-auto">
        {/* First row: Logo (left), Title (center), Date/Time (right) */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-blue-200">
          <div className="flex items-center justify-center relative">
            {/* Logo - Left */}
            <div className="absolute left-0 flex items-center">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fbd65b3cd7a86452e803a3d7dc7a3d048%2F5e321b77d52a4d30b523674ca83ee1d4?format=webp&width=800"
                alt="GSM Fueling Logo"
                className="h-16 md:h-24 w-auto"
              />
            </div>

            {/* Title - Center */}
            <div className="flex items-center gap-2">
              <Fuel className="text-blue-600" size={22} />
              <h1 className="text-xl font-bold text-gray-900">
                Fuel Dashboard
              </h1>
            </div>

            {/* Date/Time and Stats - Right */}
            <div className="absolute right-0 flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <Calendar size={16} className="text-blue-600" />
                <span className="hidden sm:inline">{currentDateTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Second row: LDN Sites Card (center), Search Bar, Refresh, Download (right) */}
        <div className="px-4 md:px-6 py-1 md:py-2">
          <div className="flex items-center gap-3">
            <div className="flex-1"></div>
            {/* LDN Sites Card - Center */}
            <Button
              onClick={() => openModal("vvvip")}
              variant="outline"
              size="sm"
              className="gap-2 border-blue-300 bg-blue-50 text-gray-700 hover:bg-blue-100 hover:text-gray-900 whitespace-nowrap"
            >
              <span>🏢</span>
              <span className="hidden sm:inline">
                LDN Sites ({vvvipSites.length})
              </span>
              <span className="sm:hidden">LDN</span>
            </Button>

            {/* Right-aligned controls */}
            <div className="flex items-center gap-3 ml-auto">
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
                      refreshing
                        ? "animate-spin text-blue-600"
                        : "text-blue-600"
                    }
                  />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button
                  onClick={handleDownloadExcel}
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
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 md:px-6 py-2 pointer-events-auto">
        <div className="max-w-7xl mx-auto">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-3">
            <KPICard
              title="Total Sites"
              value={sites.length}
              icon={MapPin}
              color="bg-blue-600"
              gradient="from-blue-100 to-blue-200"
              trend={12}
              borderColor="border-blue-600"
            />
            <KPICard
              title="Due"
              value={sites.filter((s) => s.status === "overdue").length}
              icon={AlertCircle}
              color="bg-blue-600"
              gradient="from-blue-100 to-blue-200"
              borderColor="border-blue-600"
            />
            <KPICard
              title="Today"
              value={sites.filter((s) => s.status === "today").length}
              icon={Clock}
              color="bg-gray-600"
              gradient="from-gray-100 to-gray-200"
              borderColor="border-gray-600"
            />
            <KPICard
              title="Tomorrow"
              value={sites.filter((s) => s.status === "tomorrow").length}
              icon={TrendingUp}
              color="bg-blue-400"
              gradient="from-blue-50 to-blue-100"
              borderColor="border-blue-400"
            />
            <KPICard
              title="Upcoming"
              value={
                sites.filter(
                  (s) => s.status === "incoming" || s.status === "coming",
                ).length
              }
              icon={CheckCircle2}
              color="bg-gray-500"
              gradient="from-gray-50 to-gray-100"
              borderColor="border-gray-500"
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[38%_62%] gap-3 h-auto">
            {/* Left Column - Status Cards (Scrollable) */}
            <div className="flex flex-col gap-2 overflow-y-auto pr-2 max-h-[500px]">
              {/* Performance Chart */}
              <PerformanceChart sites={sites} />

              {/* Due Card */}
              <StatusCard
                title="Due"
                borderColor="border-t-4 border-t-blue-600"
                sites={dueSites}
                icon="🔵"
                gradient="from-blue-100 to-blue-200"
                onClick={() => openModal("overdue")}
              />

              {/* Today Card */}
              <StatusCard
                title="Today"
                borderColor="border-t-4 border-t-gray-600"
                sites={todaySites}
                icon="⚪"
                gradient="from-gray-100 to-gray-200"
                onClick={() => openModal("today")}
              />

              {/* Tomorrow Card */}
              <StatusCard
                title="Tomorrow"
                borderColor="border-t-4 border-t-blue-400"
                sites={tomorrowSites}
                icon="🔷"
                gradient="from-blue-50 to-blue-100"
                onClick={() => openModal("tomorrow")}
              />

              {/* Incoming Card (2-4 days) */}
              <StatusCard
                title="Incoming (2-4D)"
                borderColor="border-t-4 border-t-gray-400"
                sites={incomingSites}
                icon="▫️"
                gradient="from-gray-50 to-gray-100"
                onClick={() => openModal("incoming")}
              />

              {/* Coming Card (5+ days) */}
              <StatusCard
                title="Coming"
                borderColor="border-t-4 border-t-gray-300"
                sites={comingSites}
                icon="⬜"
                gradient="from-white to-gray-50"
                onClick={() => openModal("coming")}
              />
            </div>

            {/* Right Column - Map Container */}
            <div className="flex flex-col gap-2" style={{ height: "520px" }}>
              {/* Map Container with Double Borders */}
              <div className="border-4 border-blue-600 rounded-xl shadow-lg p-1 overflow-hidden flex-1 flex flex-col">
                <div className="border-2 border-red-500 rounded-lg h-full overflow-hidden flex-1">
                  <FuelingMap sites={sites} />
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
      </main>

      {/* Search Results Popup - Page Level */}
      {showSearchPopup && filteredSites.length > 0 && (
        <div className="fixed top-20 right-4 md:right-8 bg-white border border-blue-300 rounded-lg shadow-2xl z-[9999] max-h-96 overflow-y-auto w-80">
          <div className="p-3">
            <p className="text-xs font-bold text-gray-600 mb-2">
              Found {filteredSites.length} site
              {filteredSites.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-2">
              {filteredSites.map((site) => (
                <div
                  key={site.id}
                  className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:border-blue-400 transition-colors"
                >
                  <p className="font-bold text-gray-900 text-sm">
                    {site.siteName}
                  </p>
                  <div className="mt-2 space-y-1 text-xs">
                    <p className="text-gray-700">
                      <span className="font-semibold">Next Fueling:</span>{" "}
                      {site.nextFuelingDate
                        ? new Date(site.nextFuelingDate).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )
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

      {showSearchPopup && filteredSites.length === 0 && (
        <div className="fixed top-20 right-4 md:right-8 bg-white border border-yellow-300 rounded-lg shadow-2xl z-[9999] p-3 w-80">
          <p className="text-sm text-gray-600 text-center">
            No sites found matching "{searchTerm}"
          </p>
        </div>
      )}

      {/* Detail Modals - Only show if explicitly opened */}
      {modalState?.open === true && modalState?.type === "overdue" && (
        <DetailModal
          title="Due"
          sites={dueSites}
          icon="🔵"
          gradient="from-blue-100 to-blue-200"
          onClose={closeModal}
        />
      )}
      {modalState?.open === true && modalState?.type === "today" && (
        <DetailModal
          title="Today"
          sites={todaySites}
          icon="⚪"
          gradient="from-gray-100 to-gray-200"
          onClose={closeModal}
        />
      )}
      {modalState?.open === true && modalState?.type === "tomorrow" && (
        <DetailModal
          title="Tomorrow"
          sites={tomorrowSites}
          icon="🔷"
          gradient="from-blue-50 to-blue-100"
          onClose={closeModal}
        />
      )}
      {modalState?.open === true && modalState?.type === "incoming" && (
        <DetailModal
          title="Incoming (2-4D)"
          sites={incomingSites}
          icon="▫️"
          gradient="from-gray-50 to-gray-100"
          onClose={closeModal}
        />
      )}
      {modalState?.open === true && modalState?.type === "coming" && (
        <DetailModal
          title="Coming"
          sites={comingSites}
          icon="⬜"
          gradient="from-white to-gray-50"
          onClose={closeModal}
        />
      )}

      {/* VVVIP Sites Modal */}
      {modalState?.open === true && modalState?.type === "vvvip" && (
        <div
          className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-100 to-blue-200 flex items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏢</span>
                <h2 className="text-xl font-bold text-gray-900">
                  LDN Sites (VVVIP)
                </h2>
                <span className="ml-auto text-xs bg-white/30 text-gray-900 rounded-full px-3 py-1 font-semibold">
                  {vvvipSites.length}{" "}
                  {vvvipSites.length === 1 ? "site" : "sites"}
                </span>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-900 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {vvvipSites.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-400">No VVVIP sites</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 font-bold text-gray-700">
                        Site Name
                      </th>
                      <th className="text-left px-6 py-3 font-bold text-gray-700">
                        Next Fueling Date
                      </th>
                      <th className="text-left px-6 py-3 font-bold text-gray-700">
                        Priority
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {vvvipSites.map((site) => (
                      <tr
                        key={site.id}
                        className={`transition-colors ${getRowHighlightColor(site.nextFuelingDate)}`}
                      >
                        <td className="px-6 py-3 text-gray-800 font-medium">
                          {site.siteName}
                        </td>
                        <td className="px-6 py-3 text-gray-700">
                          {site.nextFuelingDate
                            ? (() => {
                                const date = new Date(site.nextFuelingDate);
                                date.setHours(date.getHours() + 3);
                                const day = String(date.getDate()).padStart(
                                  2,
                                  "0",
                                );
                                const month = String(
                                  date.getMonth() + 1,
                                ).padStart(2, "0");
                                const year = date.getFullYear();
                                return `${day}/${month}/${year}`;
                              })()
                            : "Not set"}
                        </td>
                        <td className="px-6 py-3 text-gray-700 font-semibold">
                          <span className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-xs">
                            {site.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
