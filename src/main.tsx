import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/archivo";
import "./ui/arena.css";
import "./ui/settings.css";
import "./styles.css";
import "./live.css";
import "./party-games.css";
import "./bus.css";
import "./table-games.css";
import "./mobile-games.css";
import App from "./App";
import { I18nProvider } from "./i18n";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>,
);
