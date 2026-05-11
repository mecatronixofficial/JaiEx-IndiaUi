"use client";

import { useState, memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Files,
  FolderOpen,
  Share2,
  Trash2,
  Search,
  Users,
  BarChart3,
  HardDrive,
  Upload,
  ChevronRight,
  Shield,
  LogOut,
  AlertTriangle,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui";
import { formatBytes } from "@/lib/utils";
import Button from "../ui/Button";
import Image from "next/image";
import Img_Helper from "@/helper/img_helper";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <Home size={18} /> },
  { href: "/files", label: "My Files", icon: <Files size={18} /> },
  { href: "/folders", label: "Folders", icon: <FolderOpen size={18} /> },
  { href: "/shared", label: "Shared", icon: <Share2 size={18} /> },
  { href: "/search", label: "Search", icon: <Search size={18} /> },
  { href: "/trash", label: "Trash", icon: <Trash2 size={18} /> },
];

const adminItems: NavItem[] = [
  { href: "/admin", label: "Overview", icon: <BarChart3 size={18} /> },
  { href: "/admin/users", label: "Users", icon: <Users size={18} /> },
  { href: "/admin/storage", label: "Storage", icon: <HardDrive size={18} /> },
];

interface SidebarProps {
  storageUsed?: number;
  storageQuota?: number;
  onUpload?: () => void;
}

function Sidebar({
  storageUsed = 0,
  storageQuota = 10737418240,
  onUpload,
}: SidebarProps) {
  const pathname = usePathname();

  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isAdmin = user?.role === "admin";

  const usedPct = Math.min((storageUsed / storageQuota) * 100, 100);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }

    return pathname.startsWith(href);
  };

  async function handleLogout() {
    try {
      await logout();
    } finally {
      setShowLogoutModal(false);
    }
  }

  const navLinkClass = (active: boolean) => `
    group
    flex items-center
    gap-3

    rounded-2xl
    px-3
    py-3

    mb-1

    text-sm
    font-medium

    border

    transition-all duration-200

    ${
      active
        ? `
          border-orange-500/20
          bg-gradient-to-r
          from-orange-500/15
          to-amber-500/10

          text-orange-500

          shadow-lg
          shadow-orange-500/10
        `
        : `
          border-transparent

          text-gray-600
          dark:text-gray-300

          hover:bg-gray-100
          hover:text-orange-500

          dark:hover:bg-zinc-800
          dark:hover:text-orange-400
        `
    }
  `;

  return (
    <>
      <aside
        style={{
          width: collapsed ? 78 : 270,
          transition: "width 0.25s ease",
        }}
        className="
          sticky top-0
          flex h-screen flex-col
          shrink-0

          overflow-hidden

          border-r border-gray-200
          bg-white/80
          backdrop-blur-xl

          dark:border-zinc-800
          dark:bg-zinc-950/80
        "
      >
        {/* HEADER */}

        <div
          className="
            flex items-center justify-between

            border-b border-gray-200
            dark:border-zinc-800

            px-4 py-4
          "
        >
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div
                className="
                  flex h-10 w-10 items-center justify-center
                  rounded-2xl
                  shadow-lg 
                "
              >
                <Image
                  src={Img_Helper.logo.jai_logo}
                  alt="jai-india"
                  className="object-contain w-8 h-8"
                />
              </div>

              <div>
                <h2
                  className="
                    font-bold
                    text-gray-900
                    dark:text-white
                  "
                >
                  Jai Export
                </h2>

                <p
                  className="
                    text-xs
                    text-gray-500
                    dark:text-gray-400
                  "
                >
                  Secure Storage
                </p>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((p) => !p)}
            className="
              h-10 w-10
              rounded-xl
            "
          >
            <ChevronRight
              size={18}
              className={`
                transition-transform duration-300
                ${collapsed ? "rotate-0" : "rotate-180"}
              `}
            />
          </Button>
        </div>

        {/* UPLOAD */}

        <div className="p-4">
          <Button
            onClick={onUpload}
            fullWidth
            leftIcon={<Upload size={18} />}
            className={`
              h-12
              rounded-2xl
              font-semibold

              ${collapsed ? "px-0" : ""}
            `}
          >
            {!collapsed && "Upload Files"}
          </Button>
        </div>

        {/* NAVIGATION */}

        <nav
          className="
            flex-1
            overflow-y-auto
            px-3
            pb-4
          "
        >
          {navItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClass(active)}
              >
                <span className="shrink-0">{item.icon}</span>

                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          {/* ADMIN */}

          {isAdmin && (
            <div className="mt-6">
              {!collapsed && (
                <div
                  className="
                    mb-2
                    px-3

                    text-xs
                    font-bold
                    uppercase
                    tracking-wider

                    text-gray-400
                  "
                >
                  Admin
                </div>
              )}

              {adminItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={navLinkClass(active)}
                  >
                    <span className="shrink-0">{item.icon}</span>

                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* STORAGE */}

        {!collapsed && (
          <div
            className="
              border-t border-gray-200
              dark:border-zinc-800

              px-4 py-4
            "
          >
            <div className="mb-2 flex items-center justify-between">
              <span
                className="
                  text-xs
                  font-medium

                  text-gray-500
                  dark:text-gray-400
                "
              >
                Storage
              </span>

              <span
                className="
                  text-xs
                  text-gray-500
                  dark:text-gray-400
                "
              >
                {formatBytes(storageUsed)} / {formatBytes(storageQuota)}
              </span>
            </div>

            <div
              className="
                h-2
                overflow-hidden
                rounded-full

                bg-gray-200
                dark:bg-zinc-800
              "
            >
              <div
                style={{
                  width: `${usedPct}%`,
                }}
                className="
                  h-full rounded-full

                  bg-gradient-to-r
                  from-orange-500
                  to-amber-400

                  transition-all duration-500
                "
              />
            </div>
          </div>
        )}

        {/* USER */}

        <div
          className="
            border-t border-gray-200
            dark:border-zinc-800

            p-4
          "
        >
          <div
            className={`
              flex items-center
              ${collapsed ? "justify-center" : "gap-3"}
            `}
          >
            <Avatar name={user?.name || "User"} size={40} />

            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <div
                    className="
                      truncate
                      text-sm
                      font-semibold

                      text-gray-900
                      dark:text-white
                    "
                  >
                    {user?.name}
                  </div>

                  <div
                    className="
                      truncate
                      text-xs

                      text-gray-500
                      dark:text-gray-400
                    "
                  >
                    {user?.email}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowLogoutModal(true)}
                  className="
                    h-10 w-10
                    rounded-xl

                    hover:bg-red-500/10
                    hover:text-red-500
                  "
                >
                  <LogOut size={18} />
                </Button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* LOGOUT MODAL */}

      {showLogoutModal && (
        <div
          className="
            fixed inset-0 z-50

            flex items-center justify-center

            bg-black/50
            backdrop-blur-sm
          "
        >
          <div
            className="
              w-full max-w-sm

              rounded-3xl
              border border-gray-200
              bg-white

              p-6

              shadow-2xl

              dark:border-zinc-800
              dark:bg-zinc-900
            "
          >
            <div
              className="
                mb-4 flex h-14 w-14 items-center justify-center

                rounded-2xl

                bg-red-500/10
                text-red-500
              "
            >
              <AlertTriangle size={28} />
            </div>

            <h2
              className="
                mb-2
                text-xl
                font-bold

                text-gray-900
                dark:text-white
              "
            >
              Logout?
            </h2>

            <p
              className="
                mb-6
                text-sm

                text-gray-500
                dark:text-gray-400
              "
            >
              Are you sure you want to logout from your account?
            </p>

            <div className="flex flex-col gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </Button>

              <Button
                variant="danger"
                fullWidth
                leftIcon={<LogOut size={16} />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default memo(Sidebar);
