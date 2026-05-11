"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { adminApi } from "@/lib/api";
import { AdminOverview } from "@/types";
import { Card, Spinner } from "@/components/ui";
import { formatBytes, formatRelative } from "@/lib/utils";

import { Users, Files, HardDrive, Activity, Upload } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { handleApiError } from "@/lib/error-handler";
import { error } from "console";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [overview, setOverview] = useState<AdminOverview | null>(null);

  const [activity, setActivity] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    async function loadData() {
      try {
        setLoading(true);

        const [overviewRes, activityRes] = await Promise.allSettled([
          adminApi.overview(),
          adminApi.activity(),
        ]);

        if (overviewRes.status === "fulfilled") {
          setOverview(
            overviewRes.value.data?.overview || overviewRes.value.data,
          );
        }

        if (activityRes.status === "fulfilled") {
          const data =
            activityRes.value.data?.activity || activityRes.value.data || [];

          setActivity(Array.isArray(data) ? data.slice(0, 10) : []);
        }
      } catch {
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, router]);

  const stats = overview
    ? [
        {
          title: "Total Users",
          value: overview.totalUsers?.toLocaleString(),
          sub: `${overview.activeUsers} Active`,
          icon: <Users className="w-5 h-5" />,
          color: "from-orange-500 to-orange-600",
        },
        {
          title: "Total Files",
          value: overview.totalFiles?.toLocaleString(),
          icon: <Files className="w-5 h-5" />,
          color: "from-blue-500 to-blue-600",
        },
        {
          title: "Storage Used",
          value: formatBytes(overview.totalStorage || 0),
          icon: <HardDrive className="w-5 h-5" />,
          color: "from-yellow-500 to-yellow-600",
        },
        {
          title: "Uploads Today",
          value: overview.recentUploads?.toLocaleString(),
          icon: <Upload className="w-5 h-5" />,
          color: "from-green-500 to-green-600",
        },
      ]
    : [];

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-8 animate-fade-in">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Monitor platform analytics and activities
            </p>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner size={36} />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {stats.map((item, index) => (
                  <Card
                    key={index}
                    className="p-5 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.title}
                        </p>

                        <h2 className="mt-2 text-2xl font-bold">
                          {item.value}
                        </h2>

                        {item.sub && (
                          <p className="mt-1 text-xs text-orange-500 font-medium">
                            {item.sub}
                          </p>
                        )}
                      </div>

                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-lg`}
                      >
                        {item.icon}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Main Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card className="overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="font-semibold text-lg">Recent Activity</h2>
                  </div>

                  <div>
                    {activity.length === 0 ? (
                      <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                        No activity found
                      </div>
                    ) : (
                      activity.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <Activity className="w-4 h-4 text-orange-500" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {item.user?.name} • {item.type}
                            </p>

                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatRelative(item.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                {/* Quick Links */}
                <div className="space-y-5">
                  {[
                    {
                      title: "Manage Users",
                      desc: "Control platform users and permissions",
                      href: "/admin/users",
                      icon: <Users className="w-5 h-5" />,
                    },

                    {
                      title: "Storage Reports",
                      desc: "Monitor storage analytics",
                      href: "/admin/storage",
                      icon: <HardDrive className="w-5 h-5" />,
                    },

                    {
                      title: "System Activity",
                      desc: "Track all operations and logs",
                      href: "/transactions",
                      icon: <Activity className="w-5 h-5" />,
                    },
                  ].map((item, index) => (
                    <a key={index} href={item.href} className="block">
                      <Card className="p-5 hover:border-orange-500 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center">
                            {item.icon}
                          </div>

                          <div>
                            <h3 className="font-semibold">{item.title}</h3>

                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
