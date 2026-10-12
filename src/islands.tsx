// Client entry. Pages are static HTML; only the elements marked data-island get React.
import "./site.css";
import { hydrateRoot } from "react-dom/client";
import { ISLANDS, type IslandName } from "./island-registry";

for (const el of document.querySelectorAll<HTMLElement>("[data-island]")) {
  const Component = ISLANDS[el.dataset.island as IslandName];
  if (Component) hydrateRoot(el, <Component {...JSON.parse(el.dataset.props ?? "{}")} />);
}
