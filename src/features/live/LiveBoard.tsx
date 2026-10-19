import { useState } from "react";
import { useI18n } from "../../i18n";
import { rouletteOutcomes } from "../../../shared/content";
import type { RoomView } from "../../../shared/rooms";
import type { RoundResult } from "../../../shared/live-games";
import { PlayingCard } from "../../games/GameControls";
import { PlayerChip } from "./PlayerChip";
import { LiveBus } from "./LiveBus";
import { LiveBluff } from "./LiveBluff";
import { LiveDice } from "./LiveDice";
import { LiveSpy } from "./LiveSpy";
import { LiveTruths } from "./LiveTruths";
import { LiveWolf } from "./LiveWolf";

type Send = (input: Record<string, unknown>) => void;
interface BoardProps {
  room: RoomView;
  disabled: boolean;
  send: Send;
}

/** The play area of the Live games that are more than a card on the table. */
export function LiveBoard({ room, disabled, send }: BoardProps) {
  const live = room.live;
  if (!live) return null;
  const props = { room, disabled, send };
  if (live.kind === "bus") return <LiveBus view={live} {...props} />;
  if (live.kind === "spy") return <LiveSpy view={live} {...props} />;
  if (live.kind === "werewolf") return <LiveWolf view={live} {...props} />;
  if (live.kind === "bluff") return <LiveBluff view={live} {...props} />;
  if (live.kind === "liars-dice") return <LiveDice view={live} {...props} />;
  if (live.kind === "two-truths") return <LiveTruths view={live} {...props} />;
  return (
    <>
      {live.kind === "higher-lower" && <HigherLowerBoard {...props} />}
      {live.kind === "emoji" && <EmojiBoard key={room.round} {...props} />}
      {live.kind === "quickfire" && <QuickfireBoard {...props} />}
      {live.kind === "roulette" && (
        <RouletteBoard key={room.round} {...props} />
      )}
      {live.kind === "hot-potato" && <PotatoBoard {...props} />}
      {live.kind !== "roulette" && (
        <Scoreboard
          room={room}
          unit={live.kind === "hot-potato" ? "sips" : "points"}
        />
      )}
    </>
  );
}

function Scoreboard({
  room,
  unit,
}: {
  room: RoomView;
  unit: "points" | "sips";
}) {
  const { t } = useI18n();
  const ranked = [...room.members].sort(
    (a, b) => (room.scores[b.id] ?? 0) - (room.scores[a.id] ?? 0),
  );
  return (
    <div className="live-scores">
      <p className="eyebrow">
        {unit === "sips"
          ? t("Slurker så langt", "Sips so far")
          : t("Poeng", "Points")}
      </p>
      <ul className="live-score-grid">
        {ranked.map((member) => (
          <li key={member.id}>
            <PlayerChip name={member.name} size={36}>
              <strong>{room.scores[member.id] ?? 0}</strong>
            </PlayerChip>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Waiting({ room }: { room: RoomView }) {
  const { t } = useI18n();
  return (
    <p className="muted small" role="status">
      {room.voted} / {room.members.length}{" "}
      {t(
        "har svart. Svarene er skjult til alle er klare eller verten viser dem.",
        "have answered. Answers stay hidden until everyone is in or the host reveals them.",
      )}
    </p>
  );
}

/** Who got it right or wrong once the round is open. */
function Results({
  room,
  results,
  show,
}: {
  room: RoomView;
  results: Record<string, RoundResult>;
  show: (value: string) => string;
}) {
  const { t } = useI18n();
  return (
    <ul className="live-results">
      {room.members.map((member) => {
        const result = results[member.id];
        return (
          <li
            key={member.id}
            className={result ? `is-${result.outcome}` : "is-none"}
          >
            <PlayerChip name={member.name} size={44}>
              <em>
                {result ? show(result.value) : t("Ikke svart", "No answer")}
              </em>
              <strong>
                {!result
                  ? "–"
                  : result.outcome === "wrong"
                    ? t("Slurk", "Sip")
                    : result.outcome === "tie"
                      ? t("Likt", "Tie")
                      : `+${result.points}`}
              </strong>
            </PlayerChip>
          </li>
        );
      })}
    </ul>
  );
}

function HigherLowerBoard({ room, disabled, send }: BoardProps) {
  const { t } = useI18n();
  const live = room.live;
  if (live?.kind !== "higher-lower") return null;
  const guess = (value: "higher" | "lower") =>
    send({ action: "answer", value });
  return (
    <div className="live-board">
      <div className="higher-cards">
        <PlayingCard card={live.current} />
        <span aria-hidden="true">→</span>
        {live.next ? (
          <PlayingCard card={live.next} />
        ) : (
          <PlayingCard card={live.current} back />
        )}
      </div>
      {live.results ? (
        <Results
          room={room}
          results={live.results}
          show={(value) =>
            value === "higher" ? t("Høyere", "Higher") : t("Lavere", "Lower")
          }
        />
      ) : room.hasVoted ? (
        <>
          <h3>{t("Gjettet ditt er inne.", "Your guess is in.")}</h3>
          <Waiting room={room} />
        </>
      ) : (
        <>
          <p className="muted small">
            {t(
              "Blir neste kort høyere eller lavere? Ess er lavest, og like kort er trygge.",
              "Will the next card be higher or lower? Aces are low, and ties are safe.",
            )}
          </p>
          <div className="actions centered">
            <button
              className="button primary"
              disabled={disabled}
              onClick={() => guess("higher")}
            >
              ↑ {t("Høyere", "Higher")}
            </button>
            <button
              className="button secondary"
              disabled={disabled}
              onClick={() => guess("lower")}
            >
              ↓ {t("Lavere", "Lower")}
            </button>
          </div>
          <Waiting room={room} />
        </>
      )}
    </div>
  );
}

function EmojiBoard({ room, disabled, send }: BoardProps) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const live = room.live;
  if (live?.kind !== "emoji") return null;
  return (
    <div className="live-board">
      <div className="prompt-card live-prompt live-emoji">
        <p className="eyebrow">Emoji Decoder / {live.topic}</p>
        <h2 aria-label={t("Emojiene", "The emoji")}>{live.emoji}</h2>
        {live.answer && <p className="live-answer">{live.answer}</p>}
      </div>
      {live.results ? (
        <Results room={room} results={live.results} show={(value) => value} />
      ) : room.hasVoted ? (
        <>
          <h3>{t("Svaret ditt er inne.", "Your answer is in.")}</h3>
          <Waiting room={room} />
        </>
      ) : (
        <>
          <form
            className="live-answer-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (text.trim()) send({ action: "answer", value: text });
            }}
          >
            <label className="field">
              {t("Hva er det? Ett forsøk.", "What is it? One try.")}
              <input
                value={text}
                maxLength={60}
                autoComplete="off"
                autoCapitalize="sentences"
                spellCheck={false}
                disabled={disabled}
                onChange={(event) => setText(event.target.value)}
              />
            </label>
            <button
              className="button primary"
              disabled={disabled || !text.trim()}
            >
              {t("Send svar", "Send answer")}
            </button>
          </form>
          <Waiting room={room} />
        </>
      )}
    </div>
  );
}

function QuickfireBoard({ room, disabled, send }: BoardProps) {
  const { t } = useI18n();
  const live = room.live;
  if (live?.kind !== "quickfire") return null;
  const mine = live.results?.[room.you]?.value;
  return (
    <div className="live-board">
      <div className="prompt-card live-prompt">
        <p className="eyebrow">Quickfire</p>
        <h2>{live.question}</h2>
      </div>
      <div className="quick-options">
        {live.choices.map((choice, index) => {
          const answered = live.answer !== null;
          const state = !answered
            ? ""
            : index === live.answer
              ? "option-correct"
              : mine === String(index)
                ? "option-wrong"
                : "";
          return (
            <button
              key={choice}
              className={`quick-option ${state}`}
              disabled={disabled || room.hasVoted || answered}
              onClick={() => send({ action: "answer", value: String(index) })}
            >
              <span>{"ABCD"[index]}</span>
              {choice}
            </button>
          );
        })}
      </div>
      {live.results ? (
        <Results
          room={room}
          results={live.results}
          show={(value) => `${"ABCD"[Number(value)]}`}
        />
      ) : room.hasVoted ? (
        <>
          <h3>{t("Svaret ditt er inne.", "Your answer is in.")}</h3>
          <Waiting room={room} />
        </>
      ) : (
        <Waiting room={room} />
      )}
    </div>
  );
}

function RouletteBoard({ room, disabled, send }: BoardProps) {
  const { t } = useI18n();
  const live = room.live;
  const outcome = live?.kind === "roulette" ? live.outcome : null;
  const angle =
    outcome === null ? 0 : 1800 + ((360 - outcome * 45 - 22.5 + 360) % 360);
  if (live?.kind !== "roulette") return null;
  const mine = room.activePlayer === room.you;
  const result = outcome === null ? null : rouletteOutcomes[outcome];
  return (
    <div className="live-board">
      <div className="roulette-wrap">
        <span className="wheel-pointer" aria-hidden="true">
          ▼
        </span>
        <div
          className="roulette-wheel"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          {rouletteOutcomes.map((item, index) => (
            <span
              key={item.label}
              className="wheel-symbol"
              style={{
                transform: `rotate(${index * 45 + 22.5}deg) translateY(calc(var(--wheel-size, 300px) * -0.3933)) rotate(-${index * 45 + 22.5}deg)`,
              }}
            >
              {item.symbol}
            </span>
          ))}
          <span className="wheel-hub" aria-hidden="true">
            S.
          </span>
        </div>
      </div>
      <div className="roulette-result" role="status">
        <h2>
          {result?.label ??
            (mine
              ? t("Din tur til å snurre", "Your turn to spin")
              : t("Venter på hjulet …", "Waiting for the wheel …"))}
        </h2>
        <p className="muted">
          {result?.text ??
            (mine
              ? t(
                  "Trykk på knappen og la hjulet bestemme.",
                  "Tap the button and let the wheel decide.",
                )
              : t(
                  "Alle ser utfallet samtidig.",
                  "Everyone sees the result at the same time.",
                ))}
        </p>
      </div>
      {mine && outcome === null && (
        <div className="actions centered">
          <button
            className="button primary"
            disabled={disabled}
            onClick={() => send({ action: "spin" })}
          >
            {t("Snurr hjulet", "Spin the wheel")} ✳
          </button>
        </div>
      )}
    </div>
  );
}

function PotatoBoard({ room, disabled, send }: BoardProps) {
  const { t } = useI18n();
  const live = room.live;
  if (live?.kind !== "hot-potato") return null;
  const holder = room.members.find((member) => member.id === live.holder);
  const mine = live.holder === room.you;
  return (
    <div className="live-board">
      <div
        className={`live-potato${live.exploded ? " is-boom" : ""}${mine ? " is-yours" : ""}`}
        role="status"
        aria-live="assertive"
      >
        <span aria-hidden="true">{live.exploded ? "💥" : "♨"}</span>
        <h2>
          {live.exploded
            ? mine
              ? t("Bom! Du tar en slurk.", "Boom! You take a sip.")
              : `${t("Bom!", "Boom!")} ${holder?.name} ${t("tar en slurk.", "takes a sip.")}`
            : mine
              ? t("Du har poteten!", "You have the potato!")
              : `${holder?.name} ${t("har poteten", "has the potato")}`}
        </h2>
        <p className="muted">
          {live.exploded
            ? t(
                "Verten kan starte en ny potet.",
                "The host can start a new potato.",
              )
            : mine
              ? t("Gi den videre. Fort!", "Pass it on. Quick!")
              : t(
                  "Ingen vet når den går av.",
                  "Nobody knows when it goes off.",
                )}
        </p>
      </div>
      {mine && !live.exploded && (
        <div className="vote-options">
          {room.members
            .filter((member) => member.id !== room.you)
            .map((member) => (
              <button
                className="player-pick is-pass"
                key={member.id}
                disabled={disabled}
                onClick={() => send({ action: "pass", target: member.id })}
              >
                <PlayerChip name={member.name} />
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
