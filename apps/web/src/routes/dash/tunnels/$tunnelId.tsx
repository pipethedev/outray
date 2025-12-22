import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { appClient } from "../../../lib/app-client";
import {
  ArrowLeft,
  Globe,
  Activity,
  Clock,
  Shield,
  Settings,
  Copy,
  ExternalLink,
  Power,
  MoreVertical,
  Search,
  Filter,
  Download,
  Lock,
  UserCheck,
  Key,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/dash/tunnels/$tunnelId")({
  component: TunnelDetailView,
});

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) {
    return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  } else if (bytes >= 1_048_576) {
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  } else if (bytes >= 1_024) {
    return `${(bytes / 1_024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

function TunnelDetailView() {
  const { tunnelId } = Route.useParams();
  const [activeTab, setActiveTab] = useState<"overview" | "requests" | "security" | "settings">("overview");
  const [timeRange, setTimeRange] = useState("24h");

  const { data: tunnelData, isLoading: tunnelLoading } = useQuery({
    queryKey: ["tunnel", tunnelId],
    queryFn: () => appClient.tunnels.get(tunnelId),
  });

  const {
    data: statsData,
    isLoading: statsLoading,
    isPlaceholderData,
  } = useQuery({
    queryKey: ["tunnelStats", tunnelId, timeRange],
    queryFn: async () => {
      const result = await appClient.stats.tunnel(tunnelId, timeRange);
      if ("error" in result) throw new Error(result.error);
      return result;
    },
    refetchInterval: 5000,
    placeholderData: keepPreviousData,
  });

  const tunnel = tunnelData && "tunnel" in tunnelData ? tunnelData.tunnel : null;
  const stats = statsData && "stats" in statsData ? statsData.stats : null;
  const chartData = statsData && "chartData" in statsData ? statsData.chartData : [];
  const requests = statsData && "requests" in statsData ? statsData.requests : [];

  if (tunnelLoading || statsLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-20 bg-white/5 rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  if (!tunnel) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <AlertTriangle size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-medium text-white mb-2">Tunnel Not Found</h2>
        <p>The tunnel you are looking for does not exist or you don't have access to it.</p>
        <Link to="/dash/tunnels" className="mt-4 text-accent hover:underline">
          Back to Tunnels
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Link
            to="/dash/tunnels"
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">{tunnel.name || tunnel.id}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1.5 ${
                tunnel.isOnline 
                  ? "bg-green-500/10 text-green-500 border-green-500/20" 
                  : "bg-red-500/10 text-red-500 border-red-500/20"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${tunnel.isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                {tunnel.isOnline ? "Online" : "Offline"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Globe size={14} />
              <span className="font-mono">{tunnel.url}</span>
              <button 
                className="hover:text-white transition-colors"
                onClick={() => navigator.clipboard.writeText(tunnel.url)}
              >
                <Copy size={12} />
              </button>
              <a
                href={tunnel.url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 transition-colors text-sm font-medium">
              <Power size={16} />
              Stop
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 border-b border-white/5">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "requests", label: "Requests", icon: Clock },
            { id: "security", label: "Security", icon: Shield },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-accent text-accent"
                  : "border-transparent text-gray-400 hover:text-white hover:border-white/10"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Requests", value: stats?.totalRequests.toLocaleString() || "0", change: null, trend: "neutral" },
              { label: "Avg. Duration", value: `${Math.round(stats?.avgDuration || 0)}ms`, change: null, trend: "neutral" },
              { label: "Bandwidth", value: formatBytes(stats?.totalBandwidth || 0), change: null, trend: "neutral" },
              { label: "Error Rate", value: `${(stats?.errorRate || 0).toFixed(2)}%`, change: null, trend: stats?.errorRate && stats.errorRate > 0 ? "down" : "neutral" },
            ].map((stat, i) => (
              <div key={i} className="bg-white/2 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all group">
                <div className="text-sm text-gray-500 font-medium mb-2">{stat.label}</div>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-semibold text-white">{stat.value}</div>
                  {stat.change && (
                    <div className={`text-xs font-medium px-2 py-1 rounded-lg ${
                      stat.trend === "up" ? "bg-green-500/10 text-green-500" : 
                      stat.trend === "down" ? "bg-red-500/10 text-red-500" : 
                      "bg-gray-500/10 text-gray-400"
                    }`}>
                      {stat.change}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white/2 border border-white/5 rounded-2xl p-6 relative">
            {isPlaceholderData && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 rounded-2xl flex items-center justify-center transition-all duration-200">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium text-white">Traffic Overview</h3>
                <p className="text-sm text-gray-500">Requests over time</p>
              </div>
              <div className="flex bg-white/5 rounded-lg p-1">
                {["1h", "24h", "7d", "30d"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      timeRange === range
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-75 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFA62B" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FFA62B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#666" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      interval="preserveStartEnd"
                      minTickGap={30}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        if (timeRange === "1h") {
                          return date.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          });
                        } else if (timeRange === "24h") {
                          return date.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            hour12: true,
                          });
                        } else {
                          return date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          });
                        }
                      }}
                    />
                    <YAxis 
                      stroke="#666" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0A0A0A",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      itemStyle={{ color: "#fff" }}
                      labelStyle={{ color: "#9ca3af", marginBottom: "0.25rem" }}
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        });
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      stroke="#FFA62B"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRequests)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-white/5 rounded-xl border border-white/5 border-dashed">
                  <Activity size={32} className="mb-2 opacity-50" />
                  <p>No traffic data available yet</p>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white/2 border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4">Tunnel Configuration</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Region</div>
                  <div className="flex items-center gap-2 text-white">
                    <span className="text-lg">🇺🇸</span>
                    US East (N. Virginia)
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Protocol</div>
                  <div className="text-white font-mono">HTTP/2</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Client Version</div>
                  <div className="text-white font-mono">v1.2.4</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Created At</div>
                  <div className="text-white font-mono">{new Date(tunnel.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            <div className="bg-white/2 border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-sm text-gray-300 hover:text-white group">
                  <span className="flex items-center gap-2">
                    <Shield size={16} />
                    Enable Basic Auth
                  </span>
                  <div className="w-8 h-4 bg-white/10 rounded-full relative">
                    <div className="absolute left-1 top-1 w-2 h-2 bg-gray-500 rounded-full transition-all group-hover:bg-gray-400" />
                  </div>
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-sm text-gray-300 hover:text-white group">
                  <span className="flex items-center gap-2">
                    <Globe size={16} />
                    Public Access
                  </span>
                  <div className="w-8 h-4 bg-accent/20 rounded-full relative">
                    <div className="absolute right-1 top-1 w-2 h-2 bg-accent rounded-full shadow-lg shadow-accent/50" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "requests" && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Search requests..."
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 transition-colors text-sm">
              <Filter size={16} />
              Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 transition-colors text-sm">
              <Download size={16} />
              Export
            </button>
          </div>

          <div className="bg-white/2 border border-white/5 rounded-2xl overflow-hidden flex flex-col max-h-150">
            <div className="overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-gray-400 font-medium sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="px-6 py-3 bg-white/5">Status</th>
                    <th className="px-6 py-3 bg-white/5">Method</th>
                    <th className="px-6 py-3 bg-white/5">Path</th>
                    <th className="px-6 py-3 bg-white/5">Time</th>
                    <th className="px-6 py-3 bg-white/5">Duration</th>
                    <th className="px-6 py-3 bg-white/5">Size</th>
                    <th className="px-6 py-3 bg-white/5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No requests found
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          req.status >= 500 ? "bg-red-500/10 text-red-500" :
                          req.status >= 400 ? "bg-orange-500/10 text-orange-500" :
                          req.status >= 300 ? "bg-blue-500/10 text-blue-500" :
                          "bg-green-500/10 text-green-500"
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-white">{req.method}</td>
                      <td className="px-6 py-4 text-gray-300 truncate max-w-50" title={req.path}>{req.path}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(req.time).toLocaleTimeString()}</td>
                      <td className="px-6 py-4 text-gray-300">{req.duration}ms</td>
                      <td className="px-6 py-4 text-gray-500">{formatBytes(req.size)}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}
      {activeTab === "security" && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="bg-white/2 border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <Lock size={20} className="text-accent" />
                  Access Control
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Manage who can access your tunnel
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Status:</span>
                <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
                  Protected
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Basic Authentication</div>
                    <div className="text-xs text-gray-500">Require username and password</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-2">
                    <div className="text-xs text-gray-400">Username</div>
                    <div className="text-sm text-white font-mono">admin</div>
                  </div>
                  <div className="w-10 h-5 bg-accent rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                    <Key size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">API Key Protection</div>
                    <div className="text-xs text-gray-500">Require x-api-key header</div>
                  </div>
                </div>
                <div className="w-10 h-5 bg-white/10 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-3 h-3 bg-gray-500 rounded-full transition-all" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                    <Shield size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">IP Whitelisting</div>
                    <div className="text-xs text-gray-500">Restrict access to specific IPs</div>
                  </div>
                </div>
                <div className="w-10 h-5 bg-white/10 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-3 h-3 bg-gray-500 rounded-full transition-all" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/2 border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-medium text-white mb-4">IP Access Logs</h3>
            <div className="overflow-hidden rounded-xl border border-white/5">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-gray-400 font-medium">
                  <tr>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Last Seen</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { ip: "192.168.1.1", loc: "🇺🇸 US", time: "2m ago", status: "Allowed" },
                    { ip: "10.0.0.5", loc: "🇩🇪 DE", time: "15m ago", status: "Blocked" },
                    { ip: "172.16.0.1", loc: "🇬🇧 UK", time: "1h ago", status: "Allowed" },
                  ].map((log, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-mono text-gray-300">{log.ip}</td>
                      <td className="px-4 py-3 text-gray-300">{log.loc}</td>
                      <td className="px-4 py-3 text-gray-500">{log.time}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          log.status === "Allowed" 
                            ? "bg-green-500/10 text-green-500" 
                            : "bg-red-500/10 text-red-500"
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="bg-white/2 border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-medium text-white mb-6">General Settings</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Tunnel Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    defaultValue={tunnelId}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent/50 transition-all"
                  />
                  <button className="px-4 py-2.5 bg-white hover:bg-gray-200 text-black rounded-xl font-medium transition-colors">
                    Save
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This will update your tunnel URL to <span className="font-mono text-gray-400">https://new-name.outray.app</span>
                </p>
              </div>

              <div className="pt-6 border-t border-white/5">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Region
                </label>
                <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent/50 transition-all appearance-none">
                  <option>🇺🇸 US East (N. Virginia)</option>
                  <option>🇺🇸 US West (Oregon)</option>
                  <option>🇪🇺 EU Central (Frankfurt)</option>
                  <option>🌏 Asia Pacific (Singapore)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-white mb-1">Danger Zone</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Once you delete a tunnel, there is no going back. Please be certain.
                </p>
                
                <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                  <div>
                    <div className="text-sm font-medium text-white">Delete Tunnel</div>
                    <div className="text-xs text-gray-500">Permanently remove this tunnel and all its data</div>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors text-sm font-medium">
                    <Trash2 size={16} />
                    Delete Tunnel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
