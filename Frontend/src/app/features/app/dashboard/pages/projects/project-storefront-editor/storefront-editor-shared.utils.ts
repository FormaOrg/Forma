export function clampStorefrontEditorZoom(zoomPercent: number | null | undefined): number {
  const parsed = Number(zoomPercent);
  if (!Number.isFinite(parsed)) {
    return 120;
  }

  return Math.min(200, Math.max(50, Math.round(parsed)));
}

export function formatStorefrontEditorRelativeTime(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return null;
  }

  const diffMs = Date.now() - timestamp;
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return 'just now';
  }

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return 'just now';
  }

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.round(diffMs / minute));
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  if (diffMs < day) {
    const hours = Math.max(1, Math.round(diffMs / hour));
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.max(1, Math.round(diffMs / day));
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
