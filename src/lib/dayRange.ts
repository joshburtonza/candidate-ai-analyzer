// Local-day bounds + robust fetcher via supabase.functions.invoke
export type DayBounds = {
  startLocal: Date;
  endLocal: Date;
  startISO: string; // UTC instants
  endISO: string;
};

export function dayBoundsForLocal(dateStr: string): DayBounds {
  const startLocal = new Date(`${dateStr}T00:00:00`);
  const endLocal   = new Date(`${dateStr}T23:59:59.999`);
  return {
    startLocal,
    endLocal,
    startISO: startLocal.toISOString(),
    endISO: endLocal.toISOString(),
  };
}

type AnyPayload = { candidates?: unknown; items?: unknown } | unknown[] | null;

function normalizeCandidates<T = any>(payload: AnyPayload): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.candidates)) return obj.candidates as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
  }
  return [];
}

/**
 * Fetches candidates for a local day using timezone-safe UTC bounds.
 * Tries range function first, falls back to single-day function.
 */
export async function fetchByLocalDay<T = any>(
  supabase: any,
  dateStr: string
): Promise<T[]> {
  const { startISO, endISO } = dayBoundsForLocal(dateStr);

  // 1) Try UTC-safe range function
  try {
    const { data, error } = await supabase.functions.invoke(
      `candidates-by-range?from=${encodeURIComponent(startISO)}&to=${encodeURIComponent(endISO)}`
    );
    if (!error && data) {
      const list = normalizeCandidates<T>(data);
      return list;
    }
  } catch (e) {
    console.warn('Range function failed, falling back to single day:', e);
  }

  // 2) Fallback: single-day function  
  try {
    const { data, error } = await supabase.functions.invoke(
      `candidates-by-date?date=${encodeURIComponent(dateStr)}`
    );
    if (!error && data) {
      const list = normalizeCandidates<T>(data);
      return list;
    }
  } catch (e) {
    console.warn('Single day function also failed:', e);
  }

  // 3) Last resort: empty array
  return [];
}