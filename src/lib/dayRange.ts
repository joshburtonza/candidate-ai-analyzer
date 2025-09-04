// Local-day helper + unified fetch via supabase.functions.invoke

export type DayBounds = {
  startLocal: Date;
  endLocal: Date;
};

export function dayBoundsForLocal(dateStr: string): DayBounds {
  // kept for future (if you ever need local time math)
  return {
    startLocal: new Date(`${dateStr}T00:00:00`),
    endLocal:   new Date(`${dateStr}T23:59:59.999`),
  };
}

type AnyPayload = { items?: unknown; candidates?: unknown } | unknown[] | null;

function normalizeCandidates<T = any>(payload: AnyPayload): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.candidates)) return obj.candidates as T[];
  }
  return [];
}

/**
 * Uses your existing edge functions:
 * - candidates-by-range?from=YYYY-MM-DD&to=YYYY-MM-DD  (inclusive, filters received_date)
 * - candidates-by-date?date=YYYY-MM-DD
 * Returns a plain array of CVUpload-like rows.
 */
export async function fetchByLocalDay<T = any>(
  supabase: any,
  dateStr: string
): Promise<T[]> {
  // Compute next LOCAL day as YYYY-MM-DD (handles month/year rollover safely)
  const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return [];
  const next = new Date(y, m - 1, d);
  next.setDate(next.getDate() + 1);
  const to = [
    next.getFullYear(),
    String(next.getMonth() + 1).padStart(2, "0"),
    String(next.getDate()).padStart(2, "0"),
  ].join("-");

  // 1) Half-open interval [from, to) using your existing range function
  {
    const { data, error } = await supabase.functions.invoke(
      `candidates-by-range?from=${encodeURIComponent(dateStr)}&to=${encodeURIComponent(to)}`
    );
    if (!error) {
      const payload = data as any;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.candidates)
        ? payload.candidates
        : [];
      if (list.length) return list as T[];
    }
  }

  // 2) Fallback to single-day function (same YYYY-MM-DD contract)
  {
    const { data, error } = await supabase.functions.invoke(
      `candidates-by-date?date=${encodeURIComponent(dateStr)}`
    );
    if (!error) {
      const payload = data as any;
      return (Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.candidates)
        ? payload.candidates
        : []) as T[];
    }
  }

  return [];
}