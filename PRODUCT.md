# Product

## Register

product

## Users

Singapore public bus commuters, standing at or walking toward a bus stop. Primary context: outdoors, bright daylight, often one-handed, distracted, in a hurry. They open the app for a few seconds to answer one question: "when is my bus coming, and which stop is nearest me?" A secondary, calmer context is checking favourited stops before leaving home or the office.

## Product Purpose

When Bus turns a phone's GPS into an instant answer about the next bus. It finds the nearest stops, shows live arrival timings, and lets the user pin favourite stops for one-tap access. Success = the user gets the arrival time they need in under five seconds without thinking, even glancing at the screen in sunlight. It is a glance utility, not a destination app.

## Brand Personality

Fast, calm, trustworthy. Voice is plain and quiet, like a good departure board: no marketing, no exclamation, no cute mascot. It states facts (minutes, distance, stop name) with confidence and gets out of the way. Emotional goal is reassurance: "the app already knows where I am and has the answer."

## Anti-references

- Generic Material Design clone: the current "blue (#1976D2) + #f5f5f5 gray + white drop-shadow cards + emoji" look is exactly what to move away from. It reads as a tutorial app, not a considered tool.
- Emoji as core UI (star, check, triangle). Use real icons from the installed @expo/vector-icons instead.
- Over-designed, animation-heavy, or visually noisy transit apps. Restraint over flourish.
- Low-contrast, thin-weight interfaces that disappear in sunlight.

## Design Principles

1. **Answer first.** The arrival time is the hero on every screen. Everything else is secondary chrome.
2. **Glanceable in sunlight.** High contrast, large numerals, generous touch targets. Assume bright outdoor light and a moving user.
3. **The app already knows.** Location, nearest stops, and favourites should feel pre-resolved; minimize taps and waiting before the first useful number appears.
4. **Quiet confidence.** State facts plainly. No decorative gradients, no celebratory copy, no clutter competing with the timings.
5. **Honest states.** Loading, stale data, permission-denied, and no-results must be unambiguous; a commuter must never trust a stale time.

## Accessibility & Inclusion

- Target WCAG AA contrast minimum, biased higher for outdoor sunlight readability.
- Large, legible numerals and labels; comfortable (44pt+) touch targets for one-handed, on-the-move use.
- Do not encode meaning in color alone (bus load levels, freshness) — pair with text or icon.
- Respect reduced-motion; motion is never required to understand state.
