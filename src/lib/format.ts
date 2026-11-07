import type { Dictionary } from "@/lib/i18n";

export const formatSize = (bytes: number, t: Pick<Dictionary, "common">) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} ${t.common.mb}`
    : `${Math.max(1, Math.round(bytes / 1024))} ${t.common.kb}`;
