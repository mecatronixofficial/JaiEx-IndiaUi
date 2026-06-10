"use client";

import { useState } from "react";
import {
  Database, HardDrive, RefreshCw, Clock, CheckCircle,
  AlertTriangle, TrendingUp, Table2, Zap, Activity,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { formatBytes, formatRelative } from "@/lib/utils";
import Button from "@/components/ui/Button";

const DB_STATS = {
  totalSize: 18_700_000_000, dataSize: 14_200_000_000, indexSize: 4_500_000_000,
  connections: 18, maxConnections: 100, activeQueries: 4, slowQueries: 2,
  cacheHitRatio: 97.3, avgQueryMs: 6.2,
  lastBackup: "2026-05-31T02:00:00Z", nextBackup: "2026-06-01T02:00:00Z",
};

const TABLES = [
  { name: "transfers",     rows: 28_493, size: 4_200_000_000, indexes: 6, lastWrite: "2026-05-31T09:45:00Z" },
  { name: "files",         rows: 187_402,size: 3_800_000_000, indexes: 5, lastWrite: "2026-05-31T09:44:00Z" },
  { name: "users",         rows: 1_847,  size: 42_000_000,    indexes: 4, lastWrite: "2026-05-31T08:30:00Z" },
  { name: "shared_links",  rows: 15_800, size: 280_000_000,   indexes: 3, lastWrite: "2026-05-31T09:40:00Z" },
  { name: "viewer_events", rows: 541_200,size: 6_100_000_000, indexes: 4, lastWrite: "2026-05-31T09:46:00Z" },
  { name: "audit_logs",    rows: 2_840_000, size: 3_200_000_000, indexes: 3, lastWrite: "2026-05-31T09:46:00Z" },
  { name: "notifications", rows: 94_200, size: 380_000_000,   indexes: 2, lastWrite: "2026-05-31T09:30:00Z" },
];

const SLOW_QUERIES = [
  { id: "q1", query: "SELECT * FROM viewer_events JOIN transfers ON …", durationMs: 1_840, calledAt: "2026-05-31T09:30:00Z", table: "viewer_events" },
  { id: "q2", query: "UPDATE files SET metadata = $1 WHERE owner_id IN (…)", durationMs: 920,  calledAt: "2026-05-31T08:15:00Z", table: "files" },
];

const BACKUPS = [
  { id: "b1", name: "auto-backup-2026-05-31", size: 4_200_000_000, status: "complete", createdAt: "2026-05-31T02:00:00Z" },
  { id: "b2", name: "auto-backup-2026-05-30", size: 4_100_000_000, status: "complete", createdAt: "2026-05-30T02:00:00Z" },
  { id: "b3", name: "auto-backup-2026-05-29", size: 4_050_000_000, status: "complete", createdAt: "2026-05-29T02:00:00Z" },
  { id: "b4", name: "manual-pre-migration",   size: 3_900_000_000, status: "complete", createdAt: "2026-05-28T14:00:00Z" },
];

function GaugeBar({ pct, warn = 70, danger = 90 }: { pct: number; warn?: number; danger?: number }) {
  const color = pct >= danger ? "from-red-500 to-rose-500" : pct >= warn ? "from-yellow-400 to-amber-500" : "from-emerald-500 to-green-500";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-700">
      <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function DatabasePage() {
  const [tab, setTab] = useState<"tables" | "queries" | "backups">("tables");

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="animate-fade-in space-y-6 pb-10">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2.5 text-2xl font-bold text-gray-900 dark:text-white">
                <Database size={22} className="text-orange-500" /> Database
              </h1>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Database health, tables, and backup management</p>
            </div>
            <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={14} />} className="rounded-xl">Refresh</Button>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Total Size",       value: formatBytes(DB_STATS.totalSize),  icon: <HardDrive size={18} />,  color: "from-blue-500 to-cyan-500" },
              { label: "Connections",      value: `${DB_STATS.connections} / ${DB_STATS.maxConnections}`, icon: <Database size={18} />, color: "from-orange-500 to-orange-600" },
              { label: "Cache Hit Ratio",  value: `${DB_STATS.cacheHitRatio}%`,     icon: <Zap size={18} />,       color: "from-emerald-500 to-green-600" },
              { label: "Avg Query Time",   value: `${DB_STATS.avgQueryMs} ms`,      icon: <Activity size={18} />,  color: "from-purple-500 to-violet-600" },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl border border-gray-200/70 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} text-white`}>{c.icon}</div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{c.value}</p>
                <p className="text-xs text-gray-500">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Connection + storage bars */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200/70 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-900 dark:text-white">Connections</span>
                <span className="text-gray-500">{DB_STATS.connections} / {DB_STATS.maxConnections}</span>
              </div>
              <GaugeBar pct={(DB_STATS.connections / DB_STATS.maxConnections) * 100} />
              <p className="mt-2 text-xs text-gray-500">{DB_STATS.activeQueries} active queries · {DB_STATS.slowQueries} slow</p>
            </div>
            <div className="rounded-2xl border border-gray-200/70 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-900 dark:text-white">Storage</span>
                <span className="text-gray-500">{formatBytes(DB_STATS.dataSize)} data · {formatBytes(DB_STATS.indexSize)} index</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-700">
                <div className="flex h-full">
                  <div className="h-full bg-blue-500" style={{ width: `${(DB_STATS.dataSize / DB_STATS.totalSize) * 100}%` }} />
                  <div className="h-full bg-purple-400" style={{ width: `${(DB_STATS.indexSize / DB_STATS.totalSize) * 100}%` }} />
                </div>
              </div>
              <div className="mt-2 flex gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" />Data</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-400" />Index</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div>
            <div className="mb-4 flex items-center gap-1 rounded-2xl border border-gray-200/70 bg-gray-50 p-1 dark:border-zinc-800 dark:bg-zinc-900 w-fit">
              {(["tables", "queries", "backups"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)}
                  className={`rounded-xl px-4 py-1.5 text-sm font-medium capitalize transition-all ${tab === t ? "bg-white text-orange-600 shadow-sm dark:bg-zinc-800 dark:text-orange-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {tab === "tables" && (
              <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-100 bg-gray-50/60 dark:border-zinc-800 dark:bg-zinc-900/50">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Table</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Rows</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Size</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Indexes</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Last Write</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/70">
                      {TABLES.map((t) => (
                        <tr key={t.name} className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/30">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <Table2 size={14} className="text-gray-400" />
                              <span className="font-mono font-semibold text-gray-900 dark:text-white">{t.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-400">{t.rows.toLocaleString()}</td>
                          <td className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-400">{formatBytes(t.size)}</td>
                          <td className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-400">{t.indexes}</td>
                          <td className="px-4 py-3.5 text-xs text-gray-500">{formatRelative(t.lastWrite)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "queries" && (
              <div className="space-y-3">
                {SLOW_QUERIES.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-800/40 dark:bg-emerald-900/10">
                    <CheckCircle size={18} className="text-emerald-500" />
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">No slow queries detected</p>
                  </div>
                ) : (
                  SLOW_QUERIES.map((q) => (
                    <div key={q.id} className="rounded-2xl border border-yellow-200 bg-yellow-50/60 p-5 dark:border-yellow-800/30 dark:bg-yellow-900/10">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={14} className="text-yellow-600 dark:text-yellow-400" />
                          <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">Slow Query · {q.durationMs}ms</span>
                        </div>
                        <span className="text-xs text-gray-500">{formatRelative(q.calledAt)}</span>
                      </div>
                      <p className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">{q.query}</p>
                      <p className="mt-1.5 text-xs text-gray-500">Table: <span className="font-medium">{q.table}</span></p>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "backups" && (
              <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-zinc-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Next backup: <span className="text-orange-500 font-semibold">{formatRelative(DB_STATS.nextBackup)}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Daily at 02:00 UTC</p>
                  </div>
                  <Button size="sm" leftIcon={<RefreshCw size={14} />} className="rounded-xl">Run Now</Button>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-zinc-800/70">
                  {BACKUPS.map((b) => (
                    <div key={b.id} className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/20">
                          <Database size={16} />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-medium text-gray-900 dark:text-white">{b.name}</p>
                          <p className="text-xs text-gray-500">{formatBytes(b.size)} · {formatRelative(b.createdAt)}</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle size={12} /> Complete
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
