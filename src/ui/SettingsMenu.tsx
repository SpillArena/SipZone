import { Settings } from "lucide-react";
import { useState } from "react";
import { useI18n } from "../i18n";
import { openConsentDialog } from "../account/consent";
import { Dialog } from "./Dialog";
export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const { language, setLanguage, theme, setTheme, t } = useI18n();
  return (
    <>
      <button
        className="icon-button"
        type="button"
        aria-label={t("Innstillinger", "Settings")}
        onClick={() => setOpen(true)}
      >
        <Settings size={19} />
      </button>
      {open && (
        <Dialog
          title={t("Innstillinger", "Settings")}
          onClose={() => setOpen(false)}
        >
          <fieldset>
            <legend>{t("Språk", "Language")}</legend>
            <div className="segmented">
              {(
                [
                  { id: "no", label: "Norsk" },
                  { id: "en", label: "English" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  aria-pressed={language === item.id}
                  onClick={() => setLanguage(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="muted small">
              {t(
                "Spørsmål og spillinnhold er foreløpig på norsk.",
                "Questions and game content are currently in Norwegian.",
              )}
            </p>
          </fieldset>
          <fieldset>
            <legend>{t("Utseende", "Appearance")}</legend>
            <div className="segmented">
              {(
                [
                  { id: "dark", label: t("Mørk", "Dark") },
                  { id: "light", label: t("Lys", "Light") },
                  { id: "system", label: t("System", "System") },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  aria-pressed={theme === item.id}
                  onClick={() => setTheme(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>
          <button
            className="button secondary full"
            onClick={() => {
              setOpen(false);
              openConsentDialog();
            }}
          >
            {t("Endre lagringsvalg", "Manage storage choice")}
          </button>
        </Dialog>
      )}
    </>
  );
}
