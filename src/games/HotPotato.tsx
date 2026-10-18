import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { potatoDuration, potatoExpired } from "../../shared/engine";
import type { Player } from "../../shared/engine";
import { useI18n } from "../i18n";
import { Round, Next } from "./GameControls";

export function HotPotato({
  players,
  rounds,
  onFinish,
}: {
  players: Player[];
  rounds: number;
  onFinish: () => void;
}) {
  const [round, setRound] = useState(1);
  const [holder, setHolder] = useState(0);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);
  const [challenge, setChallenge] = useState(false);
  const { t } = useI18n();
  const check = () => {
    if (deadline !== null && potatoExpired(deadline)) {
      setExpired(true);
      return true;
    }
    return false;
  };
  useEffect(() => {
    if (deadline === null || expired) return;
    const update = () => {
      if (potatoExpired(deadline)) setExpired(true);
    };
    const interval = setInterval(update, 100);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("focus", update);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("focus", update);
    };
  }, [deadline, expired]);
  return (
    <Round
      round={round}
      rounds={rounds}
      player={players[holder].name}
      playerLabel={
        expired
          ? t("Poteten stoppet hos", "Caught with the potato")
          : t("Mobilen er hos", "Holding the phone")
      }
    >
      <div
        className={`potato-stage ${deadline && !expired ? "potato-running" : ""} ${expired ? "potato-burst" : ""}`}
        aria-hidden="true"
      >
        <span>◉</span>
      </div>
      <div className="roulette-result" role="status">
        <h2>
          {expired
            ? `${players[holder].name}${t(" satt igjen med poteten!", " got the hot potato!")}`
            : deadline
              ? t("Send den videre!", "Pass it on!")
              : t("Hold deg klar.", "Get ready.")}
        </h2>
        <p className="muted">
          {expired
            ? t(
                "Velg én slurk eller en liten oppgave.",
                "Choose one sip or a little challenge.",
              )
            : deadline
              ? `${t("Gi mobilen til", "Pass the phone to")} ${players[(holder + 1) % players.length].name}. ${t("Trykk først når de holder den.", "Tap once they’re holding it.")}`
              : t(
                  "Tidtakeren er hemmelig. Den stopper ikke om du bytter fane.",
                  "The timer is secret. Switching tabs won’t stop it.",
                )}
        </p>
      </div>
      {challenge && (
        <p className="result-message">
          {t(
            "Hold en ti sekunders salgspresentasjon for en helt vanlig sokk.",
            "Give a ten-second sales pitch for an ordinary sock.",
          )}
        </p>
      )}
      <div className="actions centered game-actions">
        {!deadline ? (
          <button
            className="button primary"
            onClick={() => setDeadline(Date.now() + potatoDuration())}
          >
            {t("Start poteten", "Start the potato")}
          </button>
        ) : !expired ? (
          <button
            className="button primary pass-button"
            onClick={() => {
              if (!check()) setHolder((holder + 1) % players.length);
            }}
          >
            {t("Send videre til", "Pass to")}{" "}
            {players[(holder + 1) % players.length].name}
            <ArrowRight size={20} />
          </button>
        ) : (
          <>
            <button
              className="button secondary"
              onClick={() => setChallenge(true)}
            >
              {t("Gi meg en oppgave", "Give me a challenge")}
            </button>
            <Next
              last={round >= rounds}
              onClick={() => {
                if (round >= rounds) onFinish();
                else {
                  setRound(round + 1);
                  setHolder((holder + 1) % players.length);
                  setDeadline(null);
                  setExpired(false);
                  setChallenge(false);
                }
              }}
            />
          </>
        )}
      </div>
    </Round>
  );
}
