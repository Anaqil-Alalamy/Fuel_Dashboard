import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Search,
  MapPin,
  Fuel,
  AlertCircle,
  TrendingUp,
  Download,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
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

const mockSites: FuelingSchedule[] = [
  {
    id: "GSM001",
    siteName: "Downtown Station",
    location: "123 Main St, City Center",
    fuelType: "Diesel",
    scheduledDate: new Date().toISOString().split("T")[0],
    status: "today",
    lastUpdated: new Date().toISOString(),
    latitude: 40.7128,
    longitude: -74.006,
  },
  {
    id: "GSM002",
    siteName: "Airport Hub",
    location: "456 Terminal Rd, Airport Zone",
    fuelType: "Premium Gasoline",
    scheduledDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    status: "tomorrow",
    lastUpdated: new Date().toISOString(),
    latitude: 40.6895,
    longitude: -74.1745,
  },
  {
    id: "GSM003",
    siteName: "Highway Junction",
    location: "789 Interstate Ave, North Valley",
    fuelType: "Regular Gasoline",
    scheduledDate: new Date(Date.now() + 172800000).toISOString().split("T")[0],
    status: "coming",
    lastUpdated: new Date().toISOString(),
    latitude: 40.7614,
    longitude: -73.9776,
  },
  {
    id: "GSM004",
    siteName: "Industrial Complex",
    location: "321 Factory Ln, Industrial Dist",
    fuelType: "Heavy Diesel",
    scheduledDate: new Date(Date.now() - 172800000).toISOString().split("T")[0],
    status: "overdue",
    lastUpdated: new Date().toISOString(),
    latitude: 40.7489,
    longitude: -73.968,
  },
  {
    id: "GSM005",
    siteName: "Suburban Terminal",
    location: "555 Oak Blvd, Suburbs",
    fuelType: "Diesel",
    scheduledDate: new Date().toISOString().split("T")[0],
    status: "today",
    lastUpdated: new Date().toISOString(),
    latitude: 40.6501,
    longitude: -73.9496,
  },
  {
    id: "GSM006",
    siteName: "Commercial Park",
    location: "888 Commerce Dr, Business Park",
    fuelType: "Premium Gasoline",
    scheduledDate: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    status: "overdue",
    lastUpdated: new Date().toISOString(),
    latitude: 40.7282,
    longitude: -74.0076,
  },
  {
    id: "GSM007",
    siteName: "Metro Station",
    location: "200 Transit Way, Central Hub",
    fuelType: "Regular Gasoline",
    scheduledDate: new Date(Date.now() + 259200000).toISOString().split("T")[0],
    status: "coming",
    lastUpdated: new Date().toISOString(),
    latitude: 40.7549,
    longitude: -73.984,
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "today":
      return "bg-yellow-50 border-yellow-200 text-yellow-700";
    case "tomorrow":
      return "bg-blue-50 border-blue-200 text-blue-700";
    case "coming":
      return "bg-green-50 border-green-200 text-green-700";
    case "overdue":
      return "bg-red-50 border-red-200 text-red-700";
    default:
      return "bg-gray-50 border-gray-200 text-gray-700";
  }
};

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "today":
      return "bg-yellow-100 text-yellow-800";
    case "tomorrow":
      return "bg-blue-100 text-blue-800";
    case "coming":
      return "bg-green-100 text-green-800";
    case "overdue":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusLabel = (status: string) => {
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

const SiteCard = ({ site }: { site: FuelingSchedule }) => {
  return (
    <div
      className={cn(
        "border rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow text-sm md:text-base",
        getStatusColor(site.status),
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm md:text-base truncate">
            {site.siteName}
          </h3>
          <p className="text-xs opacity-75 flex items-center gap-1 mt-1 line-clamp-2">
            <MapPin size={12} className="flex-shrink-0" />
            <span>{site.location}</span>
          </p>
        </div>
        <span
          className={cn(
            "text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0",
            getStatusBadgeColor(site.status),
          )}
        >
          {getStatusLabel(site.status)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
        <div>
          <p className="opacity-75 text-xs">Fuel Type</p>
          <p className="font-medium text-sm">{site.fuelType}</p>
        </div>
        <div>
          <p className="opacity-75 text-xs">Scheduled</p>
          <p className="font-medium text-sm">
            {new Date(site.scheduledDate).toLocaleDateString()}
          </p>
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
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ size: number; className?: string }>;
  color: string;
}) => (
  <Card className="border-0 shadow-md">
    <CardHeader className="pb-2 md:pb-3">
      <CardTitle className="text-xs md:text-sm font-medium text-gray-600 flex items-center gap-2">
        <Icon size={16} className={cn(color, "flex-shrink-0")} />
        <span className="truncate">{title}</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl md:text-3xl font-bold text-gray-900">
        {value}
      </div>
      <p className="text-xs text-gray-500 mt-1">Active sites</p>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [sites, setSites] = useState<FuelingSchedule[]>(mockSites);

  const filteredSites = sites.filter(
    (site) =>
      site.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.location.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const todaySites = filteredSites.filter((s) => s.status === "today");
  const tomorrowSites = filteredSites.filter((s) => s.status === "tomorrow");
  const comingSites = filteredSites.filter((s) => s.status === "coming");
  const overdueSites = filteredSites.filter((s) => s.status === "overdue");

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex-shrink-0">
                <Fuel className="text-white" size={24} />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                  Fuel Dashboard
                </h1>
                <p className="text-xs md:text-sm text-gray-500 truncate">
                  GSM Sites Fueling Management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="gap-2 whitespace-nowrap"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 whitespace-nowrap"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* KPI Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          <KPICard
            title="Total Sites"
            value={sites.length}
            icon={MapPin}
            color="text-blue-600"
          />
          <KPICard
            title="Today Schedule"
            value={todaySites.length}
            icon={Clock}
            color="text-yellow-600"
          />
          <KPICard
            title="Upcoming (3 Days)"
            value={tomorrowSites.length + comingSites.length}
            icon={TrendingUp}
            color="text-green-600"
          />
          <KPICard
            title="Overdue"
            value={overdueSites.length}
            icon={AlertCircle}
            color="text-red-600"
          />
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              placeholder="Search sites by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-gray-200"
            />
          </div>
        </div>

        {/* Schedules Tabs */}
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-white border border-gray-200 h-auto p-1 rounded-lg text-xs md:text-sm">
            <TabsTrigger
              value="today"
              className="flex items-center gap-1 md:gap-2 px-1 md:px-2"
            >
              <Clock size={14} className="md:w-4 md:h-4" />
              <span className="hidden md:inline text-xs">Today</span>
              <span className="inline md:hidden text-xs">
                {todaySites.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="tomorrow"
              className="flex items-center gap-1 md:gap-2 px-1 md:px-2"
            >
              <TrendingUp size={14} className="md:w-4 md:h-4" />
              <span className="hidden md:inline text-xs">Tomorrow</span>
              <span className="inline md:hidden text-xs">
                {tomorrowSites.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="coming"
              className="flex items-center gap-1 md:gap-2 px-1 md:px-2"
            >
              <CheckCircle2 size={14} className="md:w-4 md:h-4" />
              <span className="hidden md:inline text-xs">Coming</span>
              <span className="inline md:hidden text-xs">
                {comingSites.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="overdue"
              className="flex items-center gap-1 md:gap-2 px-1 md:px-2"
            >
              <AlertTriangle size={14} className="md:w-4 md:h-4" />
              <span className="hidden md:inline text-xs">Overdue</span>
              <span className="inline md:hidden text-xs">
                {overdueSites.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            <div className="space-y-4">
              {todaySites.length === 0 ? (
                <Card>
                  <CardContent className="pt-8 text-center">
                    <p className="text-gray-500">
                      No deliveries scheduled for today
                    </p>
                  </CardContent>
                </Card>
              ) : (
                todaySites.map((site) => <SiteCard key={site.id} site={site} />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="tomorrow">
            <div className="space-y-4">
              {tomorrowSites.length === 0 ? (
                <Card>
                  <CardContent className="pt-8 text-center">
                    <p className="text-gray-500">
                      No deliveries scheduled for tomorrow
                    </p>
                  </CardContent>
                </Card>
              ) : (
                tomorrowSites.map((site) => (
                  <SiteCard key={site.id} site={site} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="coming">
            <div className="space-y-4">
              {comingSites.length === 0 ? (
                <Card>
                  <CardContent className="pt-8 text-center">
                    <p className="text-gray-500">
                      No deliveries coming in the next 3 days
                    </p>
                  </CardContent>
                </Card>
              ) : (
                comingSites.map((site) => (
                  <SiteCard key={site.id} site={site} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="overdue">
            <div className="space-y-4">
              {overdueSites.length === 0 ? (
                <Card>
                  <CardContent className="pt-8 text-center">
                    <p className="text-gray-500">No overdue deliveries</p>
                  </CardContent>
                </Card>
              ) : (
                overdueSites.map((site) => (
                  <SiteCard key={site.id} site={site} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Map Placeholder Section */}
        <div className="mt-12 mb-8">
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-base md:text-lg">
                Interactive Site Map
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Visual representation of all fueling sites and their statuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg h-64 md:h-96 flex items-center justify-center">
                <div className="text-center px-4">
                  <MapPin className="mx-auto text-gray-400 mb-3" size={40} />
                  <p className="text-gray-600 font-medium text-sm md:text-base">
                    Interactive map coming soon
                  </p>
                  <p className="text-gray-500 text-xs md:text-sm">
                    Map visualization of {sites.length} sites
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="text-center text-xs md:text-sm text-gray-500 py-6 md:py-8 border-t">
          <p>Last updated: {new Date().toLocaleTimeString()}</p>
          <p className="mt-1">Dashboard auto-refreshes every 2 minutes</p>
        </div>
      </main>
    </div>
  );
}
