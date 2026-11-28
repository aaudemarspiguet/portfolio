"use client";

import { useSyncExternalStore } from "react";

// The phone top bar lives in the layout, outside the room. This small store lets it read what the
// room is doing (tour, record player) and ask the room to act, without threading props through.

export type RoomBusState = {
  /** The room is mounted (room view, WebGL working). */
  mounted: boolean;
  touring: boolean;
  trackIndex: number;
  playing: boolean;
  /** Looking around by tilting the phone: offered only on touch screens with a motion sensor. */
  tilt: "unavailable" | "off" | "on";
};

export type RoomCommands = {
  replayTour: () => void;
  deck: (track: number, play: boolean) => void;
  /** Flies the camera to the record player. */
  showDeck: () => void;
  /** Flies back out to the whole room after `showDeck`. */
  leaveDeck: () => void;
  /** Turns tilt-to-look on or off. Must run inside the tap, since iPhones ask for motion access. */
  toggleTilt: () => void;
};

const INITIAL: RoomBusState = { mounted: false, touring: false, trackIndex: 0, playing: false, tilt: "unavailable" };

let state: RoomBusState = INITIAL;
let commands: RoomCommands | null = null;
const listeners = new Set<() => void>();

export function publishRoom(next: Partial<RoomBusState>) {
  const merged = { ...state, ...next };
  if (
    merged.mounted === state.mounted &&
    merged.touring === state.touring &&
    merged.trackIndex === state.trackIndex &&
    merged.playing === state.playing &&
    merged.tilt === state.tilt
  ) {
    return;
  }
  state = merged;
  listeners.forEach((fn) => fn());
}

export function registerRoomCommands(next: RoomCommands | null) {
  commands = next;
}

export const roomCommand: RoomCommands = {
  replayTour: () => commands?.replayTour(),
  deck: (track, play) => commands?.deck(track, play),
  showDeck: () => commands?.showDeck(),
  leaveDeck: () => commands?.leaveDeck(),
  toggleTilt: () => commands?.toggleTilt(),
};

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useRoomBus() {
  return useSyncExternalStore(subscribe, () => state, () => INITIAL);
}
