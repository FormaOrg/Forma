const SERVER_LOCAL_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;

export function parseServerDateToTimestamp(value: string | null | undefined): number {
  if (!value) {
    return Number.NaN;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return Number.NaN;
  }

  const normalized = SERVER_LOCAL_DATETIME_PATTERN.test(trimmed) ? `${trimmed}Z` : trimmed;
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}
