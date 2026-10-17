/**
 * Rosary Companion — Domain Types
 *
 * Pure TypeScript. No React, no Three.js, no Expo imports — ever.
 * Everything in src/domain must be unit-testable in plain Jest.
 */

// ---------------------------------------------------------------------------
// Languages
// ---------------------------------------------------------------------------

export type LanguageCode = "en" | "la" | "sw" | "lg";

// ---------------------------------------------------------------------------
// Prayers
// ---------------------------------------------------------------------------

/**
 * Every distinct prayer text in the app. Keys are stable identifiers used by:
 *  - prayer JSON files (assets/prayers/{lang}.json)
 *  - audio filenames (audio/{lang}/{PrayerKey}.m4a)
 *  - timing files (audio/{lang}/timings.json)
 */
export type PrayerKey =
  | "sign_of_cross"
  | "apostles_creed"
  | "our_father"
  | "hail_mary"
  | "glory_be"
  | "fatima_prayer"
  | "hail_holy_queen"
  | "closing_prayer" // "O God, whose only begotten Son..."
  // Mystery announcements: {set}_{n} where n is 1..5
  | `joyful_${1 | 2 | 3 | 4 | 5}`
  | `sorrowful_${1 | 2 | 3 | 4 | 5}`
  | `glorious_${1 | 2 | 3 | 4 | 5}`
  | `luminous_${1 | 2 | 3 | 4 | 5}`;

export type MysterySet = "joyful" | "sorrowful" | "glorious" | "luminous";

// ---------------------------------------------------------------------------
// Physical rosary (matches the 3D model)
// ---------------------------------------------------------------------------

/**
 * A physical element of the rosary. `id` MUST match the mesh/node name in the
 * glTF model exactly — this is the contract between domain and 3D scene.
 *
 * Naming convention in the glTF:
 *   crucifix
 *   opening_large_1          (Our Father bead after crucifix)
 *   opening_small_1..3       (three Hail Mary beads)
 *   medal                    (centerpiece)
 *   decade_{d}_large         (d = 1..5, Our Father bead of each decade)
 *   decade_{d}_small_{i}     (d = 1..5, i = 1..10)
 */
export interface PhysicalBead {
  id: string;
  kind: "crucifix" | "large" | "small" | "medal";
  /** 1..5 when the bead belongs to a decade, else undefined */
  decade?: number;
}

// ---------------------------------------------------------------------------
// Prayer sequence ("stops")
// ---------------------------------------------------------------------------

/**
 * One stop in the playback sequence. A stop = one prayer said at one physical
 * location. Several consecutive stops can share the same beadId (e.g. the
 * decade large bead carries: glory_be -> fatima_prayer -> mystery
 * announcement -> our_father).
 */
export interface Stop {
  /** Position in the full sequence, 0-based, contiguous. */
  index: number;
  prayerKey: PrayerKey;
  /** Physical bead this stop belongs to. Drives 3D highlighting. */
  beadId: string;
  /** 1..5 when inside a decade, else undefined. */
  decade?: number;
  /**
   * Which Hail Mary within the decade (1..10), when applicable.
   * Used for the "3 of 10" caption sublabel.
   */
  hailMaryNumber?: number;
}

/**
 * The full generated sequence for one praying session.
 * Length is fixed per mystery set (same structure for all four sets).
 */
export interface RosarySequence {
  mysterySet: MysterySet;
  stops: Stop[];
  /** beadId -> index of the FIRST stop on that bead. For tap-to-jump. */
  firstStopByBead: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Session state (shape of the Zustand store — but defined here, pure)
// ---------------------------------------------------------------------------

export interface SessionState {
  sequence: RosarySequence;
  currentStopIndex: number;
  language: LanguageCode;
  isPlaying: boolean;
}

// ---------------------------------------------------------------------------
// Content files
// ---------------------------------------------------------------------------

/** Shape of assets/prayers/{lang}.json */
export interface PrayerFile {
  language: LanguageCode;
  /** BCP-47 tag for TTS/accessibility, e.g. "en-US", "sw-KE", "lg-UG" */
  locale: string;
  prayers: Record<
    string, // PrayerKey — string here so JSON validates without TS
    {
      title: string;
      /** One entry per caption line. Highlighting advances line by line. */
      lines: string[];
    }
  >;
}

/**
 * Shape of audio/{lang}/timings.json
 * Timings are per-recording, so they live next to the audio, NOT in the
 * prayer text files. lineStartsMs[i] = when lines[i] begins in the audio.
 * Invariant: lineStartsMs.length === prayers[key].lines.length
 */
export interface TimingFile {
  language: LanguageCode;
  timings: Record<
    string, // PrayerKey
    {
      durationMs: number;
      lineStartsMs: number[];
    }
  >;
}

// ---------------------------------------------------------------------------
// Pure functions the domain module must export (implemented in rosary.ts)
// ---------------------------------------------------------------------------

export interface RosaryDomain {
  /** Deterministic; same input -> same output. */
  buildSequence(mysterySet: MysterySet): RosarySequence;
  /** All physical beads, in chain order starting from the crucifix. */
  buildBeads(): PhysicalBead[];
  /** Mon/Sat: joyful, Tue/Fri: sorrowful, Wed/Sun: glorious, Thu: luminous */
  mysteryOfTheDay(date: Date): MysterySet;
  /** Clamped advance; returns same index at end of sequence. */
  advance(state: SessionState): SessionState;
  /** Jump to first stop of a bead; no-op if beadId unknown. */
  jumpToBead(state: SessionState, beadId: string): SessionState;
}