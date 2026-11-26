// The record player's tracks. Kept apart from roomData, which pulls in three.js: the phone bar's
// ⋯ menu and the record player sheet need these titles on every page, and importing them from a
// module that imports three.js would put all of three.js in every page's first download.

export type RecordTrack = {
  id: string;
  title: string;
  src: string;
  labelColor: string;
  /** Ambient gain multiplier (all audio files are mastered to -16 LUFS). */
  volume: number;
};

/** Server-hosted tracks playable on the room's turntable and vinyl crate. */
export const RECORD_TRACKS: readonly RecordTrack[] = [
  { id: "track-01", title: "track 01 180", src: "/audio/track-01.mp3", labelColor: "#ff3b1f", volume: 0.155 },
  { id: "track-02", title: "track 02 94", src: "/audio/track-02.m4a", labelColor: "#1d5bd6", volume: 0.155 },
  { id: "track-03", title: "track 03 118", src: "/audio/track-03.m4a", labelColor: "#d49a1a", volume: 0.155 },
];
