import PressAndMedia from "./PressAndMedia";

// IA: /Newsroom aliases PressAndMedia — thin wrapper so pages.config has one route per path.
// TODO(IA): merge to a single canonical URL + redirect, or pass slug as route param when CMS supports it.

export default function Newsroom() {
  return <PressAndMedia />;
}
