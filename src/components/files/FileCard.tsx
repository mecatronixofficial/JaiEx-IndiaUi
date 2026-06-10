"use client";

import { type ReactNode, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Edit3,
  ExternalLink,
  MoreVertical,
  RotateCcw,
  Share2,
  Trash2,
  X,
} from "lucide-react";

import type { FileItem } from "@/types";
import { cn, formatBytes, formatRelative, getFileColorClass, truncate } from "@/lib/utils";
import { FileTypeIcon } from "@/components/ui/FileTypeIcon";
import { filesApi } from "@/lib/api";
import { handleApiError } from "@/lib/error-handler";
import { showToast } from "@/lib/toast";
import { Badge, DropdownMenu } from "@/components/ui";
import Button from "../ui/Button";

/* =========================================================
   TYPES
========================================================= */

interface FileCardProps {
  file: FileItem;
  onRefresh: () => void;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  isTrash?: boolean;
  isShared?: boolean;
}

export type MenuItem =
  | {
      label: string;
      icon?: ReactNode;
      onClick?: () => void;
      danger?: boolean;
      disabled?: boolean;
      divider?: false;
    }
  | { divider: true };

/* =========================================================
   ACTIONS HOOK
========================================================= */

function useFileActions(file: FileItem, onRefresh: () => void) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);

  const handleDownload = useCallback(async () => {
    try {
      const res = await filesApi.download(file.id);
      const url: string =
        res.data?.data?.downloadUrl ??
        res.data?.downloadUrl ??
        res.data?.url;
      if (!url) throw new Error("No download URL returned");

      const a = document.createElement("a");
      a.href = url;
      a.download = file.originalName || file.name;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast.success("Download started");
    } catch (err) {
      handleApiError(err);
    }
  }, [file.id, file.originalName, file.name]);

  const handleDelete = useCallback(async () => {
    try {
      // TODO: collect OTP code via a dialog before deleting
      await filesApi.delete(file.id, "");
      showToast.success("Moved to trash");
      onRefresh();
    } catch (err) {
      handleApiError(err);
    }
  }, [file.id, onRefresh]);

  const handleRestore = useCallback(async () => {
    try {
      await filesApi.restore(file.id);
      showToast.success("File restored");
      onRefresh();
    } catch (err) {
      handleApiError(err);
    }
  }, [file.id, onRefresh]);

  const handlePermanentDelete = useCallback(async () => {
    if (!window.confirm("Permanently delete this file? This action cannot be undone.")) return;
    try {
      await filesApi.permanentDelete(file.id);
      showToast.success("File permanently deleted");
      onRefresh();
    } catch (err) {
      handleApiError(err);
    }
  }, [file.id, onRefresh]);

  const handleRename = useCallback(async () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === file.name) {
      setNewName(file.name);
      setRenaming(false);
      return;
    }
    try {
      await filesApi.rename(file.id, trimmed);
      showToast.success("File renamed");
      setRenaming(false);
      onRefresh();
    } catch (err) {
      handleApiError(err);
    }
  }, [file.id, file.name, newName, onRefresh]);

  const handleShare = useCallback(() => {
    sessionStorage.setItem(
      "pending_send",
      JSON.stringify([{
        id: file.id,
        name: file.name,
        size: file.size,
        mimeType: file.mimeType,
        extension: file.extension,
      }]),
    );
    router.push("/transfers/send");
  }, [file.id, file.name, file.size, file.mimeType, file.extension, router]);

  const handleManageShares = useCallback(() => {
    router.push(`/shared?file=${file.id}`);
  }, [file.id, router]);

  return {
    renaming,
    setRenaming,
    newName,
    setNewName,
    handleDownload,
    handleDelete,
    handleRestore,
    handlePermanentDelete,
    handleRename,
    handleShare,
    handleManageShares,
  };
}

/* =========================================================
   FILE CARD
========================================================= */

export function FileCard({
  file,
  onRefresh,
  selected = false,
  onSelect,
  isTrash = false,
  isShared = false,
}: FileCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const {
    renaming, setRenaming,
    newName, setNewName,
    handleDownload,
    handleDelete,
    handleRestore,
    handlePermanentDelete,
    handleRename,
    handleShare,
    handleManageShares,
  } = useFileActions(file, onRefresh);

  const menuItems: MenuItem[] = useMemo(() => {
    if (isTrash) {
      return [
        { label: "Restore", icon: <RotateCcw size={14} />, onClick: handleRestore },
        { divider: true },
        { label: "Delete Forever", icon: <X size={14} />, onClick: handlePermanentDelete, danger: true },
      ];
    }

    return [
      { label: "Download", icon: <Download size={14} />, onClick: handleDownload },
      { label: "Rename", icon: <Edit3 size={14} />, onClick: () => setRenaming(true) },
      {
        label: isShared ? "Manage Sharing" : "Send / Share",
        icon: isShared ? <ExternalLink size={14} /> : <Share2 size={14} />,
        onClick: isShared ? handleManageShares : handleShare,
      },
      { divider: true },
      { label: "Move to Trash", icon: <Trash2 size={14} />, onClick: handleDelete, danger: true },
    ];
  }, [
    isTrash, isShared,
    handleDownload, handleDelete, handleRestore, handlePermanentDelete,
    handleShare, handleManageShares, setRenaming,
  ]);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border bg-(--bg-card) p-4 transition-all duration-300",
        selected
          ? "border-orange-500 shadow-lg shadow-orange-500/10"
          : "border-(--border) hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/5",
      )}
    >
      {/* SELECT */}
      {onSelect && (
        <input
          type="checkbox"
          aria-label={`Select ${file.name}`}
          checked={selected}
          onChange={(e) => onSelect(file.id, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-4 top-4 z-20 h-4 w-4 accent-orange-500"
        />
      )}

      {/* MENU */}
      <div className="absolute right-3 top-3 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); setMenuOpen((prev) => !prev); }}
          className="h-9 w-9 rounded-xl text-gray-500 hover:text-orange-500"
        >
          <MoreVertical size={16} />
        </Button>

        {menuOpen && (
          <DropdownMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            anchorRef={{ current: null }}
            items={menuItems}
          />
        )}
      </div>

      {/* FILE ICON */}
      <div
        className={cn(
          "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-(--border) bg-(--bg-2) text-3xl",
          getFileColorClass(file.mimeType),
        )}
      >
        <FileTypeIcon mime={file.mimeType} ext={file.extension || ""} size={28} />
      </div>

      {/* FILE NAME */}
      {renaming ? (
        <input
          autoFocus
          aria-label="Rename file"
          placeholder={file.name}
          value={newName}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRename();
            if (e.key === "Escape") { setRenaming(false); setNewName(file.name); }
          }}
          className="w-full rounded-xl border border-orange-500 bg-(--bg-2) px-3 py-2 text-sm outline-none ring-4 ring-orange-500/10"
        />
      ) : (
        <h3
          title={file.name}
          className="mb-1 truncate text-sm font-semibold text-[var(--text)]"
        >
          {truncate(file.name, 24)}
        </h3>
      )}

      {/* META */}
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>{formatBytes(file.size)}</span>
        <span>{formatRelative(file.createdAt)}</span>
      </div>

      {/* SHARED BADGE */}
      {file.isShared && !isShared && (
        <div className="mt-3">
          <Badge variant="info">Shared</Badge>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   FILE ROW
========================================================= */

export function FileRow({
  file,
  onRefresh,
  selected = false,
  onSelect,
  isTrash = false,
}: FileCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const { handleDownload, handleDelete, handleRestore, handlePermanentDelete } =
    useFileActions(file, onRefresh);

  const menuItems: MenuItem[] = useMemo(
    () =>
      isTrash
        ? [
            { label: "Restore", icon: <RotateCcw size={14} />, onClick: handleRestore },
            { label: "Delete Forever", icon: <X size={14} />, onClick: handlePermanentDelete, danger: true },
          ]
        : [
            { label: "Download", icon: <Download size={14} />, onClick: handleDownload },
            { label: "Move to Trash", icon: <Trash2 size={14} />, onClick: handleDelete, danger: true },
          ],
    [isTrash, handleDownload, handleDelete, handleRestore, handlePermanentDelete],
  );

  return (
    <tr className="border-b border-(--border) transition-colors hover:bg-(--bg-2)">
      {/* SELECT */}
      <td className="px-4 py-4">
        {onSelect && (
          <input
            type="checkbox"
            aria-label={`Select ${file.name}`}
            checked={selected}
            onChange={(e) => onSelect(file.id, e.target.checked)}
            className="h-4 w-4 accent-orange-500"
          />
        )}
      </td>

      {/* FILE */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--bg-2) text-xl">
            <FileTypeIcon mime={file.mimeType} ext={file.extension || ""} size={20} />
          </div>
          <p title={file.name} className="max-w-[260px] truncate text-sm font-medium">
            {truncate(file.name, 40)}
          </p>
        </div>
      </td>

      {/* SIZE */}
      <td className="px-4 py-4 text-sm text-[var(--text-muted)]">
        {formatBytes(file.size)}
      </td>

      {/* TYPE */}
      <td className="px-4 py-4 text-sm text-[var(--text-muted)]">
        {file.mimeType?.split("/")[1]?.toUpperCase() || "—"}
      </td>

      {/* DATE */}
      <td className="px-4 py-4 text-sm text-[var(--text-muted)]">
        {formatRelative(file.createdAt)}
      </td>

      {/* SHARED */}
      <td className="px-4 py-4">
        {file.isShared && <Badge variant="info">Shared</Badge>}
      </td>

      {/* ACTIONS */}
      <td className="px-4 py-4">
        <div className="relative flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((prev) => !prev); }}
            className="h-9 w-9 rounded-xl text-gray-500 hover:text-orange-500"
          >
            <MoreVertical size={16} />
          </Button>

          {menuOpen && (
            <DropdownMenu
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              anchorRef={{ current: null }}
              items={menuItems}
            />
          )}
        </div>
      </td>
    </tr>
  );
}
