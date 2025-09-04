// Robust text checks for a completed SA-style teaching degree.
export const ACCEPT_DEGREE_REGEX = [
  /\b(b\.?\s*ed|bed)\b/i,                                  // B.Ed / B Ed / BEd
  /\bbachelor of education\b/i,                            // spelled out
  /\bpgce\b/i,                                             // PGCE
  /\bpostgraduate certificate in education\b/i,            // PGCE spelled
  /\bpgde\b/i,                                             // PGDE
  /\bpgdip(ed| in education)?\b/i,                         // PGDipEd variants
  /\b(b\.?\s*a\.?\s*ed|ba(ed)? in education)\b/i,          // BA(Ed) / BA in Education
  /\bbsc\(ed\)\b/i,                                        // BSc(Ed) (rare)
  /\bbcom\(ed\)\b/i,                                       // BCom(Ed) (rare)
  /\bfoundation phase|intermediate phase|senior phase\b/i  // common Bed specialisations (only valid with degree context)
];

export const EXCLUDE_NON_DEGREE_REGEX = [
  /\btefl|tesol|celta\b/i,
  /\b(higher )?certificate\b/i,
  /\b(higher )?diploma\b/i,
  /\bECD\b/i
];

// If we see any of these anywhere in the quals/employment text, we treat the degree as NOT completed.
export const IN_PROGRESS_REGEX = [
  /\bin[-\s]?progress\b/i,
  /\bcurrently (studying|pursuing|enrolled)\b/i,
  /\bstudent\b/i,
  /\bpursuing\b/i,
  /\bongoing\b/i
];

const textify = (v: unknown) =>
  Array.isArray(v) ? v.join(" ") : (v ?? "").toString();

export function hasCompletedTeachingDegree(raw: Record<string, unknown>): boolean {
  const hay = [
    textify(raw.educational_qualifications),
    textify((raw as any).qualifications),
    textify((raw as any).education),
    textify(raw.current_employment),
    textify((raw as any).job_history),
  ].join(" ").toLowerCase();

  if (!hay.trim()) return false;

  // If any "in progress / student" markers exist, fail fast.
  if (IN_PROGRESS_REGEX.some(r => r.test(hay))) return false;

  // Must include at least one degree marker
  const hasDegreeToken = ACCEPT_DEGREE_REGEX.some(r => r.test(hay));
  if (!hasDegreeToken) return false;

  // If the text is ONLY non-degree certs, reject.
  // (We don't require absence of these words entirely; they can coexist with a degree, but if no degree token we fail above.)
  // Extra guard: if the text says "Higher Diploma in Early Childhood Development" and no degree token, reject (already handled).

  return true;
}