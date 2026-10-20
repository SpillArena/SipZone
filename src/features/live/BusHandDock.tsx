import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cardLabel, type Card } from "../../../shared/engine";
import { PlayingCard } from "../../games/GameControls";

export function BusHandDock({
  cards,
  canPlay,
  disabled,
  onChoose,
}: {
  cards: Card[];
  canPlay: (card: Card) => boolean;
  disabled: boolean;
  onChoose: (card: Card) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hand = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, number>());
  const raised = cards.length > 0 && (expanded || cards.some(canPlay));

  useLayoutEffect(() => {
    const next = new Map<string, number>();
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    hand.current
      ?.querySelectorAll<HTMLButtonElement>("[data-card]")
      .forEach((card) => {
        const id = card.dataset.card!;
        const left = card.getBoundingClientRect().left;
        next.set(id, left);
        const before = positions.current.get(id);
        if (!reduced && before !== undefined && Math.abs(before - left) > 1)
          card.animate(
            [{ translate: `${before - left}px 0` }, { translate: "0px 0" }],
            {
              duration: 300,
              easing: "cubic-bezier(.2,.8,.2,1)",
            },
          );
      });
    positions.current = next;
  }, [cards]);

  useEffect(() => {
    if (!expanded) return;
    const minimize = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", minimize);
    return () => window.removeEventListener("keydown", minimize);
  }, [expanded]);

  if (!cards.length) return null;

  return (
    <>
      {createPortal(
        <section
          className={`bus-hand-dock${raised ? " has-raised-cards" : ""}`}
          aria-label="Kortene dine"
        >
          <div ref={hand} className="bus-hand bus-hand-dock-cards">
            {cards.map((card) => {
              const playable = canPlay(card);
              const fullHeight = expanded || playable;
              const name = `${cardLabel(card.rank)} ${card.suit}`;
              return (
                <button
                  type="button"
                  key={`${card.rank}${card.suit}`}
                  data-card={`${card.rank}${card.suit}`}
                  className={`bus-hand-dock-card${fullHeight ? " is-raised" : ""}${playable ? " is-playable" : ""}`}
                  disabled={playable && disabled}
                  aria-label={
                    playable
                      ? `Legg ${name}`
                      : fullHeight
                        ? `Minimer hånden · ${name}`
                        : `Vis hele hånden · ${name}`
                  }
                  onClick={() => {
                    if (playable && !disabled) {
                      onChoose(card);
                      setExpanded(false);
                    } else setExpanded((value) => !value);
                  }}
                >
                  <PlayingCard card={card} />
                </button>
              );
            })}
          </div>
        </section>,
        document.body,
      )}
      <div
        className={`bus-hand-dock-spacer${raised ? " has-raised-cards" : ""}`}
        aria-hidden="true"
      />
    </>
  );
}
