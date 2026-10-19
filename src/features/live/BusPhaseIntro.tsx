import { useEffect, useRef, useState } from "react";
import type { LiveBusView } from "../../../shared/live-bus";
import { BusFrame } from "../../games/BusRoute";
import { PlayerChip } from "./PlayerChip";

const intros = {
  deal: {
    step: 0,
    title: "Fire gjetninger",
    lead: "Fire kort. Fire sjanser. Hvem kjenner kortene best?",
    rules: [
      [
        "Gjett på rundgang",
        "Rød eller svart, høyere eller lavere, innenfor eller utenfor – og til slutt sort.",
      ],
      [
        "Riktig? Del ut. Feil? Drikk.",
        "Det står 1, 2, 3 og 4 slurker på spill. Den som drikker, bekrefter på sin egen skjerm.",
      ],
      ["Behold kortene", "De samme fire kortene blir hånden din i H-en."],
    ],
  },
  h: {
    step: 1,
    title: "H-en",
    lead: "Fire gjetninger er ferdig. Nå skal hånden tømmes.",
    rules: [
      [
        "Se etter samme verdi",
        "Verten snur H-kortene. Kort på hånden som matcher, løftes automatisk.",
      ],
      [
        "Trykk for å legge",
        "Kortet legges automatisk på den nyeste matchen. Venstre side: gi 1 slurk. Høyre: ta 1 slurk. Midten: ta en shot.",
      ],
      [
        "Flest kort tar bussen",
        "Den som sitter igjen med flest kort, må gjennom pyramiden.",
      ],
    ],
  },
  bus: {
    step: 2,
    title: "Pyramiden",
    lead: "H-en er ferdig. Én siste tur til toppen.",
    rules: [
      [
        "Velg ett kort per rad",
        "Start nederst. Ess og tallkort er trygge og tar dere automatisk videre til neste rad.",
      ],
      [
        "Unngå bildekort",
        "Knekt, dame eller konge sender hele pyramiden tilbake til start.",
      ],
      [
        "Jo høyere, jo mer står på spill",
        "Bildekort gir 2, 4, 6 og 8 slurker oppover radene – eller en shot på toppen. Alle på bussen må bekrefte før nytt forsøk.",
      ],
    ],
  },
} as const;

export function BusPhaseIntro({
  view,
  disabled,
  send,
}: {
  view: LiveBusView;
  disabled: boolean;
  send: (input: Record<string, unknown>) => Promise<boolean>;
}) {
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.closest(".bus-board")?.scrollIntoView({ block: "start" });
  }, []);
  const intro = view.phaseIntro;
  if (!intro) return null;
  const copy = intros[intro.phase];
  const mine = intro.ready.includes(view.you);
  return (
    <BusFrame
      active={copy.step}
      counter={`Fase ${copy.step + 1} av 3 · gjør dere klare`}
    >
      <section className="bus-phase-intro" aria-labelledby="bus-intro-title">
        <div className={`bus-intro-art is-${intro.phase}`} aria-hidden="true">
          {Array.from(
            {
              length: intro.phase === "deal" ? 4 : intro.phase === "h" ? 7 : 6,
            },
            (_, index) => (
              <span key={index}>
                {intro.phase === "deal" ? ["♥", "♠", "♦", "♣"][index] : "✦"}
              </span>
            ),
          )}
        </div>
        <p className="eyebrow">
          {copy.step === 0 ? "La oss begynne" : "Neste etappe"}
        </p>
        <h2 id="bus-intro-title" ref={heading} tabIndex={-1}>
          {copy.title}
        </h2>
        <p className="bus-intro-lead">{copy.lead}</p>
        {intro.phase === "bus" && (
          <p className="bus-intro-riders">
            På bussen:{" "}
            <strong>
              {view.drivers
                .map((index) => view.players[index]?.name)
                .join(" og ")}
            </strong>
          </p>
        )}
        <ol className="bus-intro-rules">
          {copy.rules.map(([title, text]) => (
            <li key={title}>
              <strong>{title}</strong>
              <p>{text}</p>
            </li>
          ))}
        </ol>
        <div className="bus-intro-ready">
          <h3>Er alle klare?</h3>
          <ul aria-label="Spillernes klarstatus">
            {view.players.map((player, index) => {
              const ready = intro.ready.includes(index);
              return (
                <li key={player.id} className={ready ? "is-ready" : ""}>
                  <PlayerChip name={player.name} size={44} />
                  <span className="bus-ready-mark">
                    {ready ? "✓ Klar" : "Venter"}
                  </span>
                </li>
              );
            })}
          </ul>
          <p role="status" aria-live="polite">
            {intro.ready.length} av {view.players.length} klare · starter når
            alle er klare
          </p>
          {view.you >= 0 && (
            <button
              className={`button primary bus-ready-button${mine ? " is-ready" : ""}`}
              disabled={disabled || mine}
              onClick={async () => {
                setError("");
                if (
                  !(await send({
                    action: "bus",
                    move: "ready-phase",
                    introId: intro.id,
                  }))
                )
                  setError("Kunne ikke registrere at du er klar. Prøv igjen.");
              }}
            >
              {mine
                ? "✓ Du er klar"
                : disabled
                  ? "Registrerer …"
                  : "Jeg er klar"}
            </button>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </div>
      </section>
    </BusFrame>
  );
}
