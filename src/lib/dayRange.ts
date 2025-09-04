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
  // to = next local day (YYYY-MM-DD) to handle half-open interval
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + 1);
  const to = d.toISOString().slice(0, 10);

  // 1) Try range first (YYYY-MM-DD from, next day to)
  {
    const { data, error } = await supabase.functions.invoke(
      `candidates-by-range?from=${encodeURIComponent(dateStr)}&to=${encodeURIComponent(to)}`
    );
    if (!error) {
      const list = normalizeCandidates<T>(data);
      if (list.length) return list;
    }
  }

  // 2) Fall back to single-day function
  {
    const { data, error } = await supabase.functions.invoke(
      `candidates-by-date?date=${encodeURIComponent(dateStr)}`
    );
    if (!error) {
      return normalizeCandidates<T>(data);
    }
  }

  return [];
}