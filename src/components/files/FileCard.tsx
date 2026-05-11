"use client";
import { useState } from "react";
import {
  Download,
  Trash2,
  Share2,
  Edit3,
  RotateCcw,
  X,
  MoreVertical,
} from "lucide-react";
import { FileItem } from "@/types";
import {
  formatBytes,
  formatRelative,
  getFileIcon,
  getFileColorClass,
  truncate,
} from "@/lib/utils";
import { filesApi } from "@/lib/api";
import { Badge, DropdownMenu } from "@/components/ui";
import { handleApiError } from "@/lib/error-handler";
import { showToast } from "@/lib/toast";
import Button from "../ui/Button";

interface FileCardProps {
  file: FileItem;
  onRefresh: () => void;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  isTrash?: boolean;
  isShared?: boolean;
}

type MenuItem =
  | {
      label: string;
      icon: React.ReactNode;
      onClick: () => void;
      danger?: boolean;
      disabled?: boolean;
    }
  | { divider: true; label?: never; icon?: never; onClick?: never };

export function FileCard({
  file,
  onRefresh,
  selected,
  onSelect,
  isTrash,
  isShared,
}: FileCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);

  async function handleDownload() {
    try {
      const res = await filesApi.download(file.id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = file.originalName || file.name;
      a.click();
      URL.revokeObjectURL(url);
      showToast.success("Download started");
    } catch (err) {
      handleApiError(err);
    }
  }

  async function handleDelete() {
    try {
      await filesApi.delete(file.id);
      showToast.success("Moved to trash");
      onRefresh();
    } catch (err) {
      handleApiError(err);
    }
  }

  async function handleRestore() {
    try {
      await filesApi.restore(file.id);
      showToast.success("File restored");
      onRefresh();
    } catch (err) {
      handleApiError(err);
    }
  }

  async function handlePermanentDelete() {
    if (!confirm("Permanently delete this file? This cannot be undone."))
      return;
    try {
      await filesApi.permanentDelete(file.id);
      showToast.success("Permanently deleted");
      onRefresh();
    } catch (err) {
      handleApiError(err);
    }
  }

  async function handleRename() {
    if (newName === file.name || !newName.trim()) {
      setRenaming(false);
      return;
    }
    try {
      await filesApi.rename(file.id, newName.trim());
      showToast.success("File renamed");
      onRefresh();
      setRenaming(false);
    } catch (err) {
      handleApiError(err);
    }
  }

  async function handleUnshare() {
    try {
      await filesApi.unshare(file.id);
      showToast.success("File unshared");
      onRefresh();
    } catch (err) {
      handleApiError(err);
    }
  }

  const menuItems: MenuItem[] = isTrash
    ? [
        {
          label: "Restore",
          icon: <RotateCcw size={13} />,
          onClick: handleRestore,
        },
        { divider: true },
        {
          label: "Delete Forever",
          icon: <X size={13} />,
          onClick: handlePermanentDelete,
          danger: true,
        },
      ]
    : [
        {
          label: "Download",
          icon: <Download size={13} />,
          onClick: handleDownload,
        },
        {
          label: "Rename",
          icon: <Edit3 size={13} />,
          onClick: () => setRenaming(true),
        },
        ...(isShared
          ? [
              {
                label: "Unshare",
                icon: <X size={13} />,
                onClick: handleUnshare,
              } as MenuItem,
            ]
          : [
              {
                label: "Share",
                icon: <Share2 size={13} />,
                onClick: () => {},
              } as MenuItem,
            ]),
        { divider: true },
        {
          label: "Move to Trash",
          icon: <Trash2 size={13} />,
          onClick: handleDelete,
          danger: true,
        },
      ];

  const icon = getFileIcon(file.mimeType, file.extension || "");
  const colorClass = getFileColorClass(file.mimeType);
  const cardBg = selected ? "var(--accent-glow)" : "var(--bg-card)";
  const cardBorder = selected ? "var(--accent)" : "var(--border)";

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: "var(--radius)",
        padding: 16,
        position: "relative",
        transition: "all 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        if (!selected)
          (e.currentTarget as HTMLElement).style.borderColor =
            "var(--border-hover)";
      }}
      onMouseLeave={(e) => {
        if (!selected)
          (e.currentTarget as HTMLElement).style.borderColor = cardBorder;
      }}
    >
      {onSelect && (
        <input
          type="checkbox"
          checked={!!selected}
          onChange={(e) => onSelect(file.id, e.target.checked)}
          style={{ position: "absolute", top: 12, left: 12, zIndex: 2 }}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      <div style={{ position: "absolute", top: 10, right: 10 }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="
    h-8 w-8 rounded-xl
    text-[var(--text-muted)]
    hover:text-orange-500
  "
        >
          <MoreVertical size={16} />
        </Button>
        {menuOpen && (
          <DropdownMenu
            items={menuItems as Parameters<typeof DropdownMenu>[0]["items"]}
            onClose={() => setMenuOpen(false)}
            style={{ right: 0, top: 28 }}
          />
        )}
      </div>

      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          background: "var(--bg-3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          marginBottom: 12,
          border: "1px solid var(--border)",
        }}
        className={colorClass}
      >
        {icon}
      </div>

      {renaming ? (
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRename();
            if (e.key === "Escape") {
              setRenaming(false);
              setNewName(file.name);
            }
          }}
          autoFocus
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            background: "var(--bg-3)",
            border: "1px solid var(--accent)",
            borderRadius: 6,
            padding: "4px 8px",
            color: "var(--text)",
            fontSize: 13,
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
      ) : (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={file.name}
        >
          {truncate(file.name, 22)}
        </div>
      )}

      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{formatBytes(file.size)}</span>
        <span>{formatRelative(file.createdAt)}</span>
      </div>

      {file.isShared && !isShared && (
        <div style={{ marginTop: 8 }}>
          <Badge variant="info">Shared</Badge>
        </div>
      )}
    </div>
  );
}

export function FileRow({
  file,
  onRefresh,
  selected,
  onSelect,
  isTrash,
  isShared,
}: FileCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleDownload() {
    try {
      const res = await filesApi.download(file.id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = file.originalName || file.name;
      a.click();
      URL.revokeObjectURL(url);
      showToast.success("Download started");
    } catch (err) {
      handleApiError(err);
    }
  }
  async function handleDelete() {
    try {
      await filesApi.delete(file.id);
      showToast.success("Moved to trash");
      onRefresh();
    } catch (err) {
      handleApiError(err);
    }
  }
  async function handleRestore() {
    try {
      await filesApi.restore(file.id);
      showToast.success("File restored");
      onRefresh();
    } catch (err) {
      handleApiError(err);
    }
  }
  async function handlePermanentDelete() {
    if (!confirm("Permanently delete?")) return;
    try {
      await filesApi.permanentDelete(file.id);
      showToast.success("Permanently deleted");
      onRefresh();
    } catch (err) {
      handleApiError(err);
    }
  }

  const menuItems: MenuItem[] = isTrash
    ? [
        {
          label: "Restore",
          icon: <RotateCcw size={13} />,
          onClick: handleRestore,
        },
        {
          label: "Delete Forever",
          icon: <X size={13} />,
          onClick: handlePermanentDelete,
          danger: true,
        },
      ]
    : [
        {
          label: "Download",
          icon: <Download size={13} />,
          onClick: handleDownload,
        },
        {
          label: "Move to Trash",
          icon: <Trash2 size={13} />,
          onClick: handleDelete,
          danger: true,
        },
      ];

  return (
    <tr>
      <td>
        {onSelect && (
          <input
            type="checkbox"
            checked={!!selected}
            onChange={(e) => onSelect(file.id, e.target.checked)}
          />
        )}
      </td>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>
            {getFileIcon(file.mimeType, file.extension || "")}
          </span>
          <span style={{ fontSize: 13, fontWeight: 500 }} title={file.name}>
            {truncate(file.name, 40)}
          </span>
        </div>
      </td>
      <td style={{ color: "var(--text-muted)", fontSize: 13 }}>
        {formatBytes(file.size)}
      </td>
      <td style={{ color: "var(--text-muted)", fontSize: 12 }}>
        {file.mimeType?.split("/")[1]?.toUpperCase() || "—"}
      </td>
      <td style={{ color: "var(--text-muted)", fontSize: 12 }}>
        {formatRelative(file.createdAt)}
      </td>
      <td>{file.isShared && <Badge variant="info">Shared</Badge>}</td>
      <td>
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="
    h-8 w-8 rounded-xl
    text-[var(--text-muted)]
    hover:text-orange-500
  "
          >
            <MoreVertical size={16} />
          </Button>
          {menuOpen && (
            <DropdownMenu
              items={menuItems as Parameters<typeof DropdownMenu>[0]["items"]}
              onClose={() => setMenuOpen(false)}
              style={{ right: 0, top: 28 }}
            />
          )}
        </div>
      </td>
    </tr>
  );
}
