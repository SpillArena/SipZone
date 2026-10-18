// Vendored header, footer and lobby navigation from MelodyRush's SpillArena shell.
import type { MouseEvent, ReactNode } from "react";
import { openConsentDialog } from "../account";
import spillArenaLogo from "./spillarena-logo.svg";
export function SiteHeader({
  name,
  logo,
  onHome,
  children,
  settingsLabel,
}: {
  name: string;
  logo: string;
  onHome: (event: MouseEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
  settingsLabel: string;
}) {
  return (
    <header className="arena-header">
      <div className="arena-container arena-header-row">
        <a
          className="arena-brand"
          href={import.meta.env.BASE_URL}
          onClick={onHome}
          aria-label={name}
        >
          <img src={logo} alt="" className="arena-brand-mark" />
          <span className="arena-brand-name">{name}</span>
        </a>
        <nav className="arena-header-actions" aria-label={settingsLabel}>
          {children}
        </nav>
      </div>
    </header>
  );
}
export function LobbyLink({ label }: { label: string }) {
  return (
    <a
      className="arena-lobby-link"
      href="https://spillarena.no/"
      aria-label={label}
      title={label}
    >
      <span aria-hidden="true">←</span>
      <span className="arena-lobby-label">{label}</span>
    </a>
  );
}

export function SiteFooter({
  game,
  language = "en",
  children,
  note,
}: {
  game: string;
  language?: string;
  children?: ReactNode;
  note?: ReactNode;
}) {
  const norwegian = language.startsWith("no") || language.startsWith("nb");
  return (
    <footer className="arena-footer">
      <div className="arena-container">
        <div className="arena-footer-row">
          <a className="arena-footer-affiliation" href="https://spillarena.no/">
            <img
              className="arena-footer-logo"
              src={spillArenaLogo}
              alt=""
              width={20}
              height={20}
            />
            <span>
              {norwegian ? "En del av SpillArena" : "Part of SpillArena"}
            </span>
          </a>
          <div className="arena-footer-links">
            {children}
            <a
              href="https://spillarena.no/#privacy"
              target="_blank"
              rel="noreferrer"
            >
              {norwegian ? "Personvern" : "Privacy"}
              <span className="sr-only">
                {norwegian ? " (åpnes i ny fane)" : " (opens in a new tab)"}
              </span>
            </a>
            <a
              href="https://spillarena.no/#terms"
              target="_blank"
              rel="noreferrer"
            >
              {norwegian ? "Vilkår" : "Terms"}
              <span className="sr-only">
                {norwegian ? " (åpnes i ny fane)" : " (opens in a new tab)"}
              </span>
            </a>
            <a
              href="https://spillarena.no/#faq"
              target="_blank"
              rel="noreferrer"
            >
              FAQ
              <span className="sr-only">
                {norwegian ? " (åpnes i ny fane)" : " (opens in a new tab)"}
              </span>
            </a>
            <a
              href="https://spillarena.no/#contact"
              target="_blank"
              rel="noreferrer"
            >
              {norwegian ? "Kontakt" : "Contact"}
              <span className="sr-only">
                {norwegian ? " (åpnes i ny fane)" : " (opens in a new tab)"}
              </span>
            </a>
            <button type="button" onClick={openConsentDialog}>
              {norwegian
                ? "Informasjonskapsler og lagring"
                : "Cookies & storage"}
            </button>
            <a
              href={`https://github.com/SpillArena/${game}`}
              target="_blank"
              rel="noreferrer"
            >
              GitHub <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        {note}
        <p className="footer-contact">
          {norwegian
            ? "Spørsmål og tilbakemeldinger:"
            : "Questions and feedback:"}{" "}
          <a href="mailto:support@spillarena.no">support@spillarena.no</a>
        </p>
      </div>
    </footer>
  );
}
