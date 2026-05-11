"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Settings,
  Search,
  Moon,
  Sun,
  CheckCheck,
  X,
  Sparkles,
  Share2,
  Download,
  Upload,
  Users,
  Award,
  LogOut,
  User,
  HelpCircle,
  ChevronDown,
  FolderPlus,
  FileUp,
  Grid3x3,
  List,
} from "lucide-react";
import { notificationsApi } from "@/lib/api";
import { Notification } from "@/types";
import { formatRelative } from "@/lib/utils";
import { Avatar } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useDebounce } from "@/hooks/useDebounce";
import { showToast } from "@/lib/toast";
import Button from "../ui/Button";

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 500);

  /* =========================
     UNREAD COUNT
  ========================= */
  const unread = notifs.filter((n) => !n.isRead).length;

  /* =========================
     LOAD NOTIFICATIONS
  ========================= */
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setShowNotifs(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      // Escape to close modals
      if (e.key === "Escape") {
        if (showSearch) setShowSearch(false);
        if (showNotifs) setShowNotifs(false);
        if (showUserMenu) setShowUserMenu(false);
      }
      // Cmd/Ctrl + N for new notification (demo)
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        // Trigger notification refresh
        loadNotifications();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showSearch, showNotifs, showUserMenu]);

  // Search effect
  useEffect(() => {
    if (debouncedSearch) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  async function loadNotifications() {
    try {
      const res = await notificationsApi.list();
      const data = res.data?.data || [];
      setNotifs(Array.isArray(data) ? data : []);
    } catch {
      setNotifs([]);
    }
  }

  async function performSearch() {
    setIsSearching(true);
    try {
      // Implement search API call
      // const res = await searchApi.search(searchQuery);
      // setSearchResults(res.data);

      // Mock results for demo
      setSearchResults([
        {
          id: 1,
          type: "file",
          name: "Quarterly Report.pdf",
          path: "/documents",
        },
        { id: 2, type: "folder", name: "Project Files", path: "/projects" },
        { id: 3, type: "user", name: "John Doe", email: "john@example.com" },
      ]);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }

  async function markRead(id: string) {
    try {
      await notificationsApi.markRead(id);
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      showToast.success("Marked as read");
    } catch {
      showToast.error("Failed to mark as read");
    }
  }

  async function markAllRead() {
    try {
      await notificationsApi.markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast.success("All notifications marked as read");
    } catch {
      showToast.error("Failed to mark all as read");
    }
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
      showToast.success("Logged out successfully");
    } catch (error) {
      showToast.error("Failed to logout");
    }
  };

  const notifIcons: Record<string, React.ReactNode> = {
    share: <Share2 size={16} />,
    upload: <Upload size={16} />,
    download: <Download size={16} />,
    system: <Sparkles size={16} />,
    user: <Users size={16} />,
    achievement: <Award size={16} />,
  };

  const getNotifGradient = (type: string, isRead: boolean) => {
    if (isRead) return "bg-gray-50 dark:bg-gray-900";
    switch (type) {
      case "share":
        return "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30";
      case "upload":
        return "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30";
      case "download":
        return "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30";
      case "system":
        return "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30";
      default:
        return "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800";
    }
  };

  // Save view mode preference
  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("viewMode", mode);
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent("viewModeChange", { detail: mode }));
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-gray-200 bg-white/80 px-4 backdrop-blur-xl transition-all duration-200 dark:border-gray-800 dark:bg-black/80 sm:px-6">
        {/* Left side - Logo/Brand (optional) */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">FM</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white hidden sm:inline">
              FileManager
            </span>
          </Link>

          {/* View Toggle (optional) */}
          <div className="hidden lg:flex items-center gap-1 ml-4 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
            <Button
              variant={viewMode === "grid" ? "primary" : "ghost"}
              size="icon"
              className="rounded-lg"
              onClick={() => handleViewModeChange("grid")}
            >
              <Grid3x3 size={16} />
            </Button>
            <Button
              variant={viewMode === "list" ? "primary" : "ghost"}
              size="icon"
              className="rounded-lg"
              onClick={() => handleViewModeChange("list")}
            >
              <List size={16} />
            </Button>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <div className="hidden md:block w-80">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors duration-200 group-hover:text-orange-500 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search files, folders, or people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-12 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
              />
              <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 sm:flex">
                <span className="text-xs">⌘</span>
                <span>K</span>
              </kbd>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Quick Actions Dropdown */}
            <div className="relative">
              <Button
                variant="icon"
                size="icon"
                onClick={() => {
                  showToast.info?.("Quick actions coming soon");
                }}
              >
                <FolderPlus size={18} />
              </Button>
            </div>

            {/* Theme Toggle */}
            <Button
              variant="icon"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Sun
                  size={18}
                  className="transition-transform duration-300 group-hover:rotate-12"
                />
              ) : (
                <Moon
                  size={18}
                  className="transition-transform duration-300 group-hover:-rotate-12"
                />
              )}
            </Button>
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <Button
                variant="icon"
                size="icon"
                className="relative"
                onClick={() => setShowNotifs(!showNotifs)}
                aria-label="Notifications"
              >
                <Bell size={18} />

                {unread > 0 && (
                  <span
                    className="
        absolute -right-1 -top-1
        flex h-5 min-w-[20px]
        items-center justify-center
        rounded-full
        bg-gradient-to-r from-orange-500 to-red-500
        px-1 text-[10px]
        font-bold text-white
        shadow-lg
      "
                  >
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Button>

              {/* Notifications Dropdown */}
              {showNotifs && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifs(false)}
                  />
                  <div className="absolute right-0 top-12 z-50 w-[420px] animate-in slide-in-from-top-2 fade-in duration-200 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 py-4 dark:border-gray-800 dark:from-gray-900 dark:to-gray-900">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Notifications
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Stay updated with your activity
                        </p>
                      </div>
                      {unread > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={markAllRead}
                          className="
    text-orange-500
    hover:bg-orange-50
    dark:hover:bg-orange-500/10
  "
                        >
                          <CheckCheck size={14} />
                          Mark all read
                        </Button>
                      )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[460px] overflow-y-auto custom-scrollbar">
                      {notifs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-300">
                          <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                            <Bell size={32} className="text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            No notifications yet
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            We&apos;ll notify you when something happens
                          </p>
                        </div>
                      ) : (
                        notifs.map((n, index) => (
                          <div
                            key={n.id}
                            onClick={() => !n.isRead && markRead(n.id)}
                            className={`relative cursor-pointer transition-all duration-200 hover:shadow-md ${getNotifGradient(
                              n.type,
                              n.isRead,
                            )} border-b border-gray-100 dark:border-gray-800 ${
                              !n.isRead ? "shadow-sm" : ""
                            }`}
                            style={{
                              animationDelay: `${index * 30}ms`,
                            }}
                          >
                            <div className="flex gap-3 px-5 py-4">
                              {/* Icon */}
                              <div
                                className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                                  !n.isRead
                                    ? "bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md"
                                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                }`}
                              >
                                {notifIcons[n.type] || <Bell size={14} />}
                              </div>

                              {/* Content */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <h4
                                    className={`truncate text-sm ${
                                      n.isRead
                                        ? "font-medium text-gray-700 dark:text-gray-300"
                                        : "font-semibold text-gray-900 dark:text-white"
                                    }`}
                                  >
                                    {n.title}
                                  </h4>
                                  {!n.isRead && (
                                    <div className="mt-1.5 h-2 w-2 animate-pulse rounded-full bg-orange-500" />
                                  )}
                                </div>
                                <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-2">
                                  {n.message}
                                </p>
                                <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                                  {formatRelative(n.createdAt)}
                                </p>
                              </div>
                            </div>

                            {/* Animated border for unread */}
                            {!n.isRead && (
                              <div
                                className="absolute bottom-0 left-0 h-0.5 animate-slide-in-left bg-gradient-to-r from-orange-500 to-red-500"
                                style={{ width: "100%" }}
                              />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    {notifs.length > 0 && (
                      <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-center transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900">
                        <Link
                          href="/notifications"
                          className="text-xs font-medium text-orange-500 transition-all duration-200 hover:text-orange-600 hover:underline"
                          onClick={() => setShowNotifs(false)}
                        >
                          View all notifications →
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="secondary"
                className="
    gap-2
    rounded-xl
    px-2 py-1
  "
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="User menu"
              >
                <Avatar name={user?.name || "User"} size={32} />

                <ChevronDown
                  size={14}
                  className={`
      text-gray-500
      transition-transform duration-300
      ${showUserMenu ? "rotate-180" : ""}
    `}
                />
              </Button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-12 z-50 w-64 animate-in slide-in-from-top-2 fade-in duration-200 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
                    {/* User Info */}
                    <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.email}
                      </p>
                      <div className="mt-2">
                        <span className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-500/20 dark:text-orange-400">
                          {user?.role || "User"}
                        </span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User size={16} />
                        My Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings size={16} />
                        Settings
                      </Link>
                      <Link
                        href="/help"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <HelpCircle size={16} />
                        Help & Support
                      </Link>
                      <hr className="my-2 border-gray-100 dark:border-gray-800" />
                      <Button
                        variant="ghost"
                        className="
    w-full justify-start
    rounded-none
    text-red-600
    hover:bg-red-50
    dark:text-red-400
    dark:hover:bg-red-950/40
  "
                        onClick={handleLogout}
                      >
                        <LogOut size={16} />
                        Logout
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Command Palette Search Modal */}
      {showSearch && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowSearch(false)}
          />
          <div className="fixed left-1/2 top-1/3 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 animate-in slide-in-from-top-4 fade-in duration-200 rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="p-4">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-3 dark:border-gray-800">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search files, folders, or people..."
                  className="flex-1 bg-transparent text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSearch(false)}
                  className="rounded-lg"
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Search Results */}
              <div className="mt-4 max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                  </div>
                ) : searchQuery && searchResults.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No results found for {searchQuery}
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((result: any) => (
                      <div
                        key={result.id}
                        className="cursor-pointer rounded-lg p-3 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => {
                          router.push(`/${result.type}s/${result.id}`);
                          setShowSearch(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {result.type === "file" && (
                            <FileUp size={16} className="text-blue-500" />
                          )}
                          {result.type === "folder" && (
                            <FolderPlus size={16} className="text-yellow-500" />
                          )}
                          {result.type === "user" && (
                            <Users size={16} className="text-green-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {result.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {result.path || result.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery === "" ? (
                  <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    <kbd className="mr-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">
                      ⌘
                    </kbd>
                    <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">
                      K
                    </kbd>{" "}
                    to search
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
