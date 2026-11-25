"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Sheet, type DetentFn } from "../glass/Sheet";
import { RECORD_TRACKS } from "./roomData";
import { roomCommand, useRoomBus } from "./roomBus";

// Compact (now playing and the controls, with the deck in view above) and medium (the record list).
const DETENTS: DetentFn = (vh, max) => [Math.min(max, 196), Math.min(max, Math.round(vh * 0.55))];

/** The record player as a sheet: what's on, play / pause / skip, the records, and a camera move to the deck. */
export function RecordSheet({ onClose }: { onClose: () => void }) {
  const { trackIndex, playing } = useRoomBus();
  const [snap, setSnap] = useState<{ index: number; id: number } | undefined>(undefined);
  const showingDeck = useRef(false);
  const track = RECORD_TRACKS[trackIndex] ?? RECORD_TRACKS[0];

  function showDeck() {
    showingDeck.current = true;
    roomCommand.showDeck();
    // Drop to the compact detent so the deck sits in view above the sheet.
    setSnap((s) => ({ index: 0, id: (s?.id ?? 0) + 1 }));
  }

  function close() {
    if (showingDeck.current) roomCommand.leaveDeck();
    onClose();
  }

  return (
    <Sheet title="Record Player" titleId="recordTitle" onClose={close} detents={DETENTS} initial={1} snap={snap} escape>
      <div className="ln-rec">
        <div className="ln-rec__now">
          <span
            className={playing ? "ln-rec__disc is-spinning" : "ln-rec__disc"}
            style={{ "--label": track.labelColor } as CSSProperties}
            aria-hidden="true"
          />
          <div className="ln-rec__meta">
            <span className="ln-rec__title">{track.title}</span>
            <span className="ln-rec__by">{playing ? "playing" : "paused"} · on the record player</span>
          </div>
          <div className="ln-rec__ctrls">
            <button type="button" className="ln-gbtn" aria-label="Previous track" onClick={() => roomCommand.deck(trackIndex - 1, true)}>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="ln-gbtn__fill">
                <path d="M6 5h2v14H6zM20 5v14L9 12z" />
              </svg>
            </button>
            <button
              type="button"
              className="ln-gbtn ln-gbtn--big"
              aria-label={playing ? "Pause record player" : "Play record player"}
              onClick={() => roomCommand.deck(trackIndex, !playing)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="ln-gbtn__fill">
                {playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5v14l11-7z" />}
              </svg>
            </button>
            <button type="button" className="ln-gbtn" aria-label="Next track" onClick={() => roomCommand.deck(trackIndex + 1, true)}>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="ln-gbtn__fill">
                <path d="M16 5h2v14h-2zM4 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="ln-rec__list" role="group" aria-label="On the record">
          {RECORD_TRACKS.map((t, i) => (
            <button
              key={t.id}
              type="button"
              className="ln-rec__row"
              aria-current={i === trackIndex ? "true" : undefined}
              onClick={() => roomCommand.deck(i, true)}
            >
              <span className="ln-rec__dot" style={{ background: t.labelColor }} aria-hidden="true" />
              <span className="ln-rec__name">{t.title}</span>
              {i === trackIndex && playing && <span className="ln-rec__on">playing</span>}
            </button>
          ))}
        </div>

        <button type="button" className="ln-btn ln-rec__show" onClick={showDeck}>
          Show the Record Player
        </button>
      </div>
    </Sheet>
  );
}
