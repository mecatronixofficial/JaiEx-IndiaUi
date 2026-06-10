"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Server, Cpu, HardDrive, Activity, Database, Wifi,
  CheckCircle, AlertTriangle, XCircle, RefreshCw, Clock, Zap,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { Spinner } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { formatRelative } from "@/lib/utils";
import { handleApiError } from "@/lib/error-handler";
import { SystemHealth } from "@/types";

interface Metrics {
  cpu: number;
  memory: number;
  disk: number;
  dbConnections: number;
  dbMax: number;
  activeRequests: number;
  errorRate: number;
  uptime: number;
  requestsPerMin: number;
  avgResponseMs: number;
  lastChecked: string;
  status: "healthy" | "degraded" | "down";
}

const FALLBACK_METRICS: Metrics = {
  cpu: 0, memory: 0, disk: 0, dbConnections: 0, dbMax: 100,
  activeRequests: 0, errorRate: 0, uptime: 0,
  requestsPerMin: 0, avgResponseMs: 0,
  lastChecked: new Date().toISOString(),
  status: "healthy",
};

function mapHealth(raw: SystemHealth): Metrics {
  return {
    cpu:            raw.cpuUsage       ?? 0,
    memory:         raw.memoryUsage    ?? 0,
    disk:           raw.diskUsage      ?? 0,
    dbConnections:  raw.dbConnections  ?? 0,
    dbMax:          100,
    activeRequests: raw.activeRequests ?? 0,
    errorRate:      raw.errorRate      ?? 0,
    uptime:         raw.uptime         ?? 0,
    requestsPerMin: 0,
    avgResponseMs:  0,
    lastChecked:    raw.lastChecked    ?? new Date().toISOString(),
    status:         raw.status         ?? "healthy",
  };
}

const SERVICES = [
  { name: "API Server",       status: "operational", latency: 42,  uptime: 99.98 },
  { name: "File Storage",     status: "operational", latency: 12,  uptime: 99.99 },
  { name: "Email Service",    status: "operational", latency: 210, uptime: 99.95 },
  { name: "Database (Main)",  status: "operational", latency: 6,   uptime: 99.97 },
  { name: "Database (Read)",  status: "operational", latency: 4,   uptime: 99.97 },
  { name: "Redis Cache",      status: "degraded",    latency: 890, uptime: 99.82 },
  { name: "CDN",              status: "operational", latency: 8,   uptime: 99.99 },
  { name: "Notification Svc", status: "operational", latency: 65,  uptime: 99.93 },
];

const RECENT_ERRORS = [
  { id: "e1", code: 500, message: "Internal server error in /api/v1/files/upload",  count: 3,  lastAt: "2026-05-30T09:45:00Z" },
  { id: "e2", code: 429, message: "Rate limit exceeded from 203.0.113.42",          count: 47, lastAt: "2026-05-30T09:30:00Z" },
  { id: "e3", code: 503, message: "Redis connection timeout (cache miss fallback)",  count: 12, lastAt: "2026-05-30T08:55:00Z" },
  { id: "e4", code: 404, message: "File not found: /uploads/tmp/expired-chunk.bin", count: 8,  lastAt: "2026-05-30T08:20:00Z" },
];

function GaugeBar({ value, max = 100, thresholds = [70, 90] }: { value: number; max?: number; thresholds?: [number, number] }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct >= thresholds[1] ? "from-red-500 to-rose-600" : pct >= thresholds[0] ? "from-yellow-400 to-amber-500" : "from-emerald-500 to-green-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-700">
      <div className={`h-full rounded-full bg-linear-to-r ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    operational: { cls: "bg-emerald-500", label: "Operational" },
    degraded:    { cls: "bg-yellow-500",  label: "Degraded" },
    down:        { cls: "bg-red-500",     label: "Down" },
  };
  const s = cfg[status] ?? cfg.operational;
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${s.cls} ${status === "operational" ? "" : "animate-pulse"}`} />
      <span className={`text-xs font-medium ${status === "operational" ? "text-emerald-600 dark:text-emerald-400" : status === "degraded" ? "text-yellow-600 dark:text-yellow-400" : "text-red-500"}`}>
        {s.label}
      </span>
    </span>
  );
}

export default function SystemHealthPage() {
  const [metrics, setMetrics] = useState<Metrics>(FALLBACK_METRICS);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await adminApi.system();
      const raw = (res.data?.data ?? res.data ?? {}) as SystemHealth;
      setMetrics(mapHealth(raw));
      setLastRefresh(new Date());
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), 30_000);
    return () => clearInterval(id);
  }, [load]);

  const allOperational = SERVICES.every((s) => s.status === "operational");

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="animate-fade-in space-y-6 pb-10">

          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2.5 text-2xl font-bold text-gray-900 dark:text-white">
                <Server size={22} className="text-orange-500" /> System Health
              </h1>
              <p className="mt-0.5 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock size={12} /> Last refreshed {formatRelative(lastRefresh.toISOString())}
              </p>
            </div>
            <button type="button" onClick={() => load()} disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-300">
              {loading ? <Spinner size={14} /> : <RefreshCw size={14} />} Refresh
            </button>
          </div>

          {/* Overall status banner */}
          <div className={`flex items-center gap-3 rounded-2xl p-4 ${allOperational ? "bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/40" : "bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/40"}`}>
            {allOperational
              ? <CheckCircle size={22} className="shrink-0 text-emerald-500" />
              : <AlertTriangle size={22} className="shrink-0 text-yellow-500" />}
            <div>
              <p className={`font-semibold ${allOperational ? "text-emerald-800 dark:text-emerald-300" : "text-yellow-800 dark:text-yellow-300"}`}>
                {allOperational ? "All Systems Operational" : "Some Systems Degraded"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {SERVICES.filter((s) => s.status === "operational").length} / {SERVICES.length} services healthy · {metrics.uptime}% uptime (30d)
              </p>
            </div>
          </div>

          {/* Resource gauges */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "CPU Usage",      value: metrics.cpu,              unit: "%",     icon: <Cpu size={18} />,      color: "text-orange-500" },
              { label: "Memory",         value: metrics.memory,           unit: "%",     icon: <Zap size={18} />,      color: "text-purple-500" },
              { label: "Disk",           value: metrics.disk,             unit: "%",     icon: <HardDrive size={18} />, color: "text-blue-500" },
              { label: "DB Connections", value: metrics.dbConnections,    unit: ` / ${metrics.dbMax}`, icon: <Database size={18} />, color: "text-emerald-500" },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl border border-gray-200/70 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-2 flex items-center justify-between">
                  <span className={`${m.color}`}>{m.icon}</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{m.value}{m.unit}</span>
                </div>
                <p className="mb-2 text-xs text-gray-500">{m.label}</p>
                <GaugeBar value={m.label === "DB Connections" ? (metrics.dbConnections / metrics.dbMax) * 100 : m.value} />
              </div>
            ))}
          </div>

          {/* Live metrics */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { label: "Requests / min",  value: metrics.requestsPerMin, icon: <Activity size={16} className="text-blue-500" /> },
              { label: "Avg Response",    value: `${metrics.avgResponseMs} ms`, icon: <Wifi size={16} className="text-emerald-500" /> },
              { label: "Error Rate",      value: `${metrics.errorRate}%`, icon: <XCircle size={16} className="text-red-400" /> },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-3 rounded-2xl border border-gray-200/70 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
                {m.icon}
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{m.value}</p>
                  <p className="text-xs text-gray-500">{m.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            {/* Services table */}
            <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-gray-100 px-6 py-4 dark:border-zinc-800">
                <h2 className="font-semibold text-gray-900 dark:text-white">Service Status</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50/60 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Service</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Latency</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Uptime (30d)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/70">
                    {SERVICES.map((s) => (
                      <tr key={s.name} className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/30">
                        <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">{s.name}</td>
                        <td className="px-4 py-3.5 text-center"><StatusDot status={s.status} /></td>
                        <td className="px-4 py-3.5 text-right text-sm text-gray-600 dark:text-gray-400">{s.latency} ms</td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={`text-sm font-semibold ${s.uptime >= 99.9 ? "text-emerald-600 dark:text-emerald-400" : "text-yellow-600 dark:text-yellow-400"}`}>
                            {s.uptime}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent errors */}
            <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-gray-100 px-6 py-4 dark:border-zinc-800">
                <h2 className="font-semibold text-gray-900 dark:text-white">Recent Errors</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-zinc-800/70">
                {RECENT_ERRORS.map((e) => (
                  <div key={e.id} className="px-5 py-4">
                    <div className="mb-1 flex items-center justify-between">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${e.code >= 500 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : e.code === 429 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400"}`}>
                        {e.code}
                      </span>
                      <span className="text-xs text-gray-400">{e.count}×</span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{e.message}</p>
                    <p className="mt-1 text-[11px] text-gray-400">{formatRelative(e.lastAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
