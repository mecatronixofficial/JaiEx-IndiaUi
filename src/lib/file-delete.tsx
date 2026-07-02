"use client";

import { FormEvent, useRef, useState } from "react";
import { createRoot, Root } from "react-dom/client";
import { AlertTriangle, CheckCircle2, KeyRound, Loader2, Mail, ShieldCheck, X } from "lucide-react";
import { authApi, filesApi } from "@/lib/api";
import { handleApiError } from "@/lib/error-handler";
import { showToast } from "@/lib/toast";

const DELETE_FILE_PURPOSE = "delete_file";

type OtpDialogResult = { action: "confirm"; code: string } | { action: "cancel" };

type OtpDialogProps = {
  count: number;
  onCancel: () => void;
  onConfirm: (code: string) => void;
  onResend: () => Promise<void>;
};

async function requestDeleteOtp(fileId?: string) {
  await authApi.requestOtp({
    purpose: DELETE_FILE_PURPOSE,
    ...(fileId ? { fileId } : {}),
  });
  showToast.success("OTP sent to your email");
}

function OtpDeleteDialog({ count, onCancel, onConfirm, onResend }: OtpDialogProps) {
  const [code, setCode] = useState("");
  const [resending, setResending] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isBulk = count > 1;
  const cleanCode = code.trim();
  const canSubmit = cleanCode.length >= 4;

  async function handleResend() {
    setResending(true);
    try {
      await onResend();
      inputRef.current?.focus();
    } finally {
      setResending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      showToast.error("Enter the OTP from your email");
      return;
    }
    onConfirm(cleanCode);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Cancel delete"
        className="absolute inset-0 cursor-default bg-zinc-950/65 backdrop-blur-sm"
        onClick={onCancel}
      />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-red-200/80 bg-white shadow-2xl shadow-red-950/15 dark:border-red-900/50 dark:bg-zinc-950"
      >
        <div className="border-b border-red-100 bg-linear-to-br from-red-50 via-white to-orange-50 p-5 dark:border-red-900/40 dark:from-red-950/30 dark:via-zinc-950 dark:to-orange-950/20">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500 text-white shadow-lg shadow-red-500/25">
              <ShieldCheck size={23} />
            </div>
            <button
              type="button"
              aria-label="Close OTP dialog"
              onClick={onCancel}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-white/80 hover:text-gray-700 dark:hover:bg-zinc-900 dark:hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-red-600 dark:text-red-400">
            <AlertTriangle size={13} />
            OTP required
          </div>
          <h2 className="mt-1 text-xl font-bold text-gray-950 dark:text-white">
            Confirm file deletion
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-gray-600 dark:text-gray-400">
            Enter the OTP sent to your email to move {isBulk ? `${count} files` : "this file"} to trash.
          </p>
        </div>

        <div className="space-y-4 p-5">
          <label className="block">
            <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
              <KeyRound size={13} />
              Email OTP
            </span>
            <input
              ref={inputRef}
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/[^\dA-Za-z-]/g, "").slice(0, 12))}
              placeholder="Enter OTP"
              className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-center font-mono text-lg font-bold tracking-[0.28em] text-gray-950 outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-red-500"
            />
          </label>

          <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50/70 p-3 text-xs text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/20 dark:text-orange-300">
            <Mail size={15} className="mt-0.5 shrink-0" />
            <p>The delete request will continue only after the OTP is verified by the server.</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:border-orange-300 hover:text-orange-600 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-gray-300"
            >
              {resending ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
              Resend OTP
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 size={15} />
              Delete
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function askForDeleteOtp(count: number, resend: () => Promise<void>): Promise<OtpDialogResult> {
  return new Promise((resolve) => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    let root: Root | null = createRoot(host);

    function cleanup(result: OtpDialogResult) {
      resolve(result);
      setTimeout(() => {
        root?.unmount();
        root = null;
        host.remove();
      }, 0);
    }

    root.render(
      <OtpDeleteDialog
        count={count}
        onCancel={() => cleanup({ action: "cancel" })}
        onConfirm={(otpCode) => cleanup({ action: "confirm", code: otpCode })}
        onResend={resend}
      />,
    );
  });
}

export async function deleteFileWithOtp(fileId: string): Promise<boolean> {
  if (!fileId) {
    showToast.error("File ID is missing. Please refresh and try again.");
    return false;
  }

  try {
    await requestDeleteOtp(fileId);
    const result = await askForDeleteOtp(1, () => requestDeleteOtp(fileId));
    if (result.action === "cancel") {
      showToast.info("Delete cancelled");
      return false;
    }

    await filesApi.delete(fileId, result.code);
    showToast.success("Moved to trash");
    return true;
  } catch (err) {
    handleApiError(err);
    return false;
  }
}

export async function bulkDeleteFilesWithOtp(fileIds: string[]): Promise<boolean> {
  const ids = fileIds.filter(Boolean);
  if (ids.length === 0) {
    showToast.error("No files selected");
    return false;
  }

  try {
    await requestDeleteOtp(ids.length === 1 ? ids[0] : undefined);
    const result = await askForDeleteOtp(ids.length, () => requestDeleteOtp(ids.length === 1 ? ids[0] : undefined));
    if (result.action === "cancel") {
      showToast.info("Delete cancelled");
      return false;
    }

    await filesApi.bulkDelete(ids, result.code);
    showToast.success(`${ids.length} file${ids.length > 1 ? "s" : ""} moved to trash`);
    return true;
  } catch (err) {
    handleApiError(err);
    return false;
  }
}
