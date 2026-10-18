import { useState } from "react";
import { CircleHelp } from "lucide-react";
import type { GameDefinition, PromptGame } from "../../shared/catalog";
import type { Player } from "../../shared/engine";
import type { GameSettings } from "./Setup";
import { useI18n } from "../i18n";
import { Dialog } from "../ui/Dialog";
import { PromptBoard } from "../games/PromptBoard";
import { Roulette } from "../games/Roulette";
import { HigherLower } from "../games/HigherLower";
import { HotPotato } from "../games/HotPotato";
import { Fate } from "../games/Fate";
import { SipDare } from "../games/SipDare";
import { SpinBottle } from "../games/SpinBottle";
import { PassBox } from "../games/PassBox";
import { Quickfire } from "../games/Quickfire";
import { Showdown } from "../games/Showdown";
import { EmojiDecoder } from "../games/EmojiDecoder";
import { CategoryRush } from "../games/CategoryRush";
import { TruthTrain } from "../games/TruthTrain";
import { BusRoute } from "../games/BusRoute";

export function LocalGame({
  game,
  players,
  settings,
  onExit,
  onReplay,
  onComplete,
}: {
  game: GameDefinition;
  players: Player[];
  settings: GameSettings;
  onExit: () => void;
  onReplay: () => void;
  onComplete: () => void;
}) {
  const [done, setDone] = useState(false);
  const [help, setHelp] = useState(false);
  const { t } = useI18n();
  if (done)
    return (
      <section className="finish-page arena-container">
        <span className="finish-star" aria-hidden="true">
          ✳
        </span>
        <p className="eyebrow">{game.name}</p>
        <h1>{t("Den satt.", "That was a round.")}</h1>
        <p className="muted">
          {t("Samme gjeng. En runde til?", "Same friends. One more round?")}
        </p>
        <div className="actions centered">
          <button className="button primary" onClick={onReplay}>
            {t("En runde til", "Play again")}
          </button>
          <button className="button secondary" onClick={onExit}>
            {t("Velg en annen lek", "Choose another game")}
          </button>
        </div>
      </section>
    );
  const finish = () => {
    setDone(true);
    onComplete();
  };
  return (
    <section className={`play-page arena-container play-${game.id}`}>
      <div className="play-top">
        <button className="back-link" onClick={onExit}>
          ← {t("Avslutt", "Finish")}
        </button>
        <span className="eyebrow">{game.name}</span>
        <button
          className="icon-button"
          aria-label={t("Spilleregler", "Game rules")}
          onClick={() => setHelp(true)}
        >
          <CircleHelp size={20} />
        </button>
      </div>
      {game.id === "roulette" && (
        <Roulette
          players={players}
          rounds={settings.rounds}
          onFinish={finish}
        />
      )}
      {["truth", "never", "most-likely"].includes(game.id) && (
        <PromptBoard
          game={game.id as PromptGame}
          players={players}
          settings={settings}
          onFinish={finish}
        />
      )}
      {game.id === "higher-lower" && (
        <HigherLower
          players={players}
          options={settings.cards}
          rounds={settings.rounds}
          onFinish={finish}
        />
      )}
      {game.id === "hot-potato" && (
        <HotPotato
          players={players}
          rounds={settings.rounds}
          onFinish={finish}
        />
      )}
      {game.id === "fate" && <Fate players={players} onFinish={finish} />}
      {game.id === "sip-dare" && (
        <SipDare players={players} settings={settings} onFinish={finish} />
      )}
      {game.id === "bottle" && (
        <SpinBottle players={players} settings={settings} onFinish={finish} />
      )}
      {game.id === "box" && (
        <PassBox players={players} settings={settings} onFinish={finish} />
      )}
      {game.id === "quickfire" && (
        <Quickfire players={players} settings={settings} onFinish={finish} />
      )}
      {game.id === "showdown" && (
        <Showdown players={players} settings={settings} onFinish={finish} />
      )}
      {game.id === "emoji" && (
        <EmojiDecoder players={players} settings={settings} onFinish={finish} />
      )}
      {game.id === "category-rush" && (
        <CategoryRush players={players} settings={settings} onFinish={finish} />
      )}
      {game.id === "truth-train" && (
        <TruthTrain players={players} settings={settings} onFinish={finish} />
      )}
      {game.id === "bus" && <BusRoute players={players} onFinish={finish} />}
      {help && (
        <Dialog
          title={t("Slik spiller dere", "How to play")}
          onClose={() => setHelp(false)}
        >
          <ol className="rules-list">
            {game.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
        </Dialog>
      )}
    </section>
  );
}
