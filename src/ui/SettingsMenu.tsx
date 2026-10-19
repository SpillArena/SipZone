import { Check, Monitor, Moon, Settings, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useI18n, type Theme } from "../i18n";
import { StorageSettings } from "./SiteShell";

// Dropdown settings menu, styled after ScribbleBot's header menu.
const LANGUAGES = [
  { id: "no", label: "Norsk" },
  { id: "en", label: "English" },
] as const;

export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const { language, setLanguage, theme, setTheme, t } = useI18n();
  const themes: { id: Theme; label: string; Icon: typeof Sun }[] = [
    { id: "dark", label: t("Mørk", "Dark"), Icon: Moon },
    { id: "system", label: t("System", "System"), Icon: Monitor },
    { id: "light", label: t("Lys", "Light"), Icon: Sun },
  ];

  useEffect(() => {
    if (!open) return;
    const pointer = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", pointer);
    window.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", pointer);
      window.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <div ref={root} className="arena-settings">
      <button
        className="arena-settings-trigger settings-trigger"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t("Innstillinger", "Settings")}
        title={t("Innstillinger", "Settings")}
        onClick={() => setOpen((value) => !value)}
      >
        <Settings size={18} />
      </button>
      {open && (
        <div
          className="arena-settings-panel settings-panel"
          role="dialog"
          aria-label={t("Innstillinger", "Settings")}
        >
          <section>
            <h3 className="settings-label">{t("Språk", "Language")}</h3>
            <div
              role="listbox"
              aria-label={t("Velg språk", "Choose language")}
              className="settings-languages"
            >
              {LANGUAGES.map((item) => {
                const selected = language === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => setLanguage(item.id)}
                  >
                    {item.label}
                    {selected && <Check size={14} />}
                  </button>
                );
              })}
            </div>
            <p className="settings-note">
              {t(
                "Spørsmål og spillinnhold er foreløpig på norsk.",
                "Questions and game content are currently in Norwegian.",
              )}
            </p>
          </section>
          <section className="settings-section">
            <h3 className="settings-label">{t("Utseende", "Appearance")}</h3>
            <div className="settings-themes">
              {themes.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={theme === id}
                  onClick={() => setTheme(id)}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </section>
          <StorageSettings
            language={language}
            onManage={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
