// Client entry. Pages are static HTML; only the elements marked data-island get React.
import "./site.css";
import "./pages/scams.css";
import { hydrateRoot } from "react-dom/client";
import { ISLANDS, type IslandName } from "./island-registry";

import { sendEvent } from "./experiment";
import { runStaticClocks } from "./components/clock";
import { runLightbox } from "./components/lightbox";

// Headline test: count TestFlight clicks per arm, on every page.
document.addEventListener("click", (e) => {
  if ((e.target as Element | null)?.closest?.('a[href^="https://testflight.apple.com/"]')) sendEvent("install_click");
});

for (const el of document.querySelectorAll<HTMLElement>("[data-island]")) {
  const Component = ISLANDS[el.dataset.island as IslandName];
  if (Component) hydrateRoot(el, <Component {...JSON.parse(el.dataset.props ?? "{}")} />);
}

runStaticClocks();
runLightbox();
