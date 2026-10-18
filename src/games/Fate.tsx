import { useState } from "react";
import { activeFateRules, cardDeck, fateRules } from "../../shared/engine";
import type { FateEffect, Player } from "../../shared/engine";
import {
  chooseFatePartner,
  fatePartnerPairs,
  type FatePartners,
} from "../../shared/fate-partners";
import { useI18n } from "../i18n";
import { Round, Next, PlayingCard } from "./GameControls";

export function Fate({
  players,
  onFinish,
}: {
  players: Player[];
  onFinish: () => void;
}) {
  const [deck] = useState(() => cardDeck());
  const [history, setHistory] = useState<FateEffect[]>([]);
  const [shown, setShown] = useState(false);
  const [houseRules, setHouseRules] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [partners, setPartners] = useState<FatePartners>({});
  const [partnerChoice, setPartnerChoice] = useState<string | null>(null);
  const { t } = useI18n();
  const index = shown ? history.length - 1 : history.length;
  const player = players[index % players.length];
  const card = shown ? history.at(-1)!.card : deck[history.length];
  const kings = history.filter((effect) => effect.card.rank === 13).length;
  const over = kings >= 4 || history.length >= 52;
  const rules = activeFateRules(history);
  const pairs = fatePartnerPairs(players, partners);
  const needsPartner = shown && card.rank === 8 && partnerChoice === null;
  return (
    <Round round={Math.min(index + 1, 52)} rounds={52} player={player.name}>
      <div className="fate-layout">
        <PlayingCard card={card} back={!shown} />
        <div className="fate-copy">
          <p className="eyebrow">
            {kings} / 4 {t("konger trukket", "kings drawn")}
          </p>
          <h2>
            {shown
              ? fateRules[card.rank].title
              : t("Hva har skjebnen på lur?", "What does fate have in store?")}
          </h2>
          <p>
            {shown
              ? over
                ? t(
                    "Den fjerde kongen er trukket. Takk for runden!",
                    "The fourth king is drawn. That’s the round!",
                  )
                : fateRules[card.rank].text
              : t(
                  "Trekk ett kort, og les regelen høyt for gjengen.",
                  "Draw a card and read the rule to your friends.",
                )}
          </p>
        </div>
      </div>
      {shown && card.rank === 13 && !over && (
        <form
          className="house-rule-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (draft.trim()) {
              setHouseRules([...houseRules, `${player.name}: ${draft.trim()}`]);
              setDraft("");
            }
          }}
        >
          <label className="field" htmlFor="house-rule">
            {t(
              "Noter husregelen (valgfritt)",
              "Save the house rule (optional)",
            )}
            <input
              id="house-rule"
              value={draft}
              maxLength={160}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t(
                "For eksempel: alle kaller glasset «koppen».",
                "For example: call every glass “the cup”.",
              )}
            />
          </label>
          <button className="button secondary" disabled={!draft.trim()}>
            {t("Legg til", "Add")}
          </button>
        </form>
      )}
      {shown && card.rank === 8 && (
        <div className="fate-partner-picker">
          {partnerChoice === null ? (
            <>
              <h3>Hvem blir makkeren din?</h3>
              <div className="vote-options">
                {players
                  .filter((other) => other.id !== player.id)
                  .map((other) => (
                    <button
                      key={other.id}
                      className="button secondary"
                      onClick={() => {
                        setPartners(
                          chooseFatePartner(
                            players,
                            partners,
                            player.id,
                            other.id,
                          ),
                        );
                        setPartnerChoice(other.id);
                      }}
                    >
                      {other.name}
                    </button>
                  ))}
              </div>
              <button
                className="text-button"
                onClick={() => setPartnerChoice("skip")}
              >
                Hopp over makkerkortet
              </button>
            </>
          ) : (
            <p className="result-message" role="status">
              {partnerChoice === "skip"
                ? "Makkerkortet er hoppet over. Tidligere par fortsetter."
                : `${player.name} og ${players.find((other) => other.id === partnerChoice)!.name} er nå makkere.`}
            </p>
          )}
        </div>
      )}
      {!needsPartner && (
        <div className="actions centered game-actions">
          {!shown ? (
            <button
              className="button primary"
              onClick={() => {
                setHistory([...history, { card, player }]);
                setShown(true);
                setPartnerChoice(null);
              }}
            >
              {t("Trekk et kort", "Draw a card")} ♠
            </button>
          ) : over ? (
            <Next onClick={onFinish} last />
          ) : (
            <Next
              onClick={() => {
                setShown(false);
                setDraft("");
              }}
            />
          )}
        </div>
      )}
      {(rules.length > 0 || houseRules.length > 0 || pairs.length > 0) && (
        <aside className="active-rules">
          <h3>{t("Regler rundt bordet", "Rules around the table")}</h3>
          {pairs.length > 0 && (
            <div className="fate-pairs">
              <h4>Aktive makkerpar</h4>
              <ul>
                {pairs.map(([first, second]) => (
                  <li key={first.id}>
                    {first.name} ↔ {second.name}
                  </li>
                ))}
              </ul>
              <p className="muted small">
                Ett par per spiller. Ny makker erstatter gamle par. Ingen slurk
                utløser en kjede.
              </p>
            </div>
          )}
          <ul>
            {[...rules, ...houseRules].map((rule, i) => (
              <li key={`${i}-${rule}`}>{rule}</li>
            ))}
          </ul>
        </aside>
      )}
    </Round>
  );
}
