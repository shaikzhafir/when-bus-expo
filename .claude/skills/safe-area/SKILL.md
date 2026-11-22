---
name: safe-area
description: Safe-area rules for when-bus screens. Load whenever adding or editing a screen, scroll container, or any element near the top or bottom screen edge, so content never clashes with the status bar / notch (top) or home indicator / gesture nav bar (bottom).
---

# Safe-area rules

All screens hide the native header (`headerShown: false`) and draw edge-to-edge
(`edgeToEdgeEnabled: true` on Android), so nothing clears the system bars for
us. Every screen must handle it explicitly.

## The one rule

Every screen-level scroll container (`ScrollView`, `FlatList`, `SectionList`)
gets its edge padding from `screenEdgePadding(insets)` in `app/theme.ts` —
never inline `insets.top + ...` / `insets.bottom + ...` math in a screen file:

```tsx
const insets = useSafeAreaInsets();
// ...
<ScrollView
  contentContainerStyle={[sharedStyles.scrollContent, screenEdgePadding(insets)]}
  scrollIndicatorInsets={{ top: insets.top, bottom: insets.bottom }}
>
```

`screenEdgePadding` guarantees:
- **Top:** content starts below the status bar / notch with breathing room.
- **Bottom:** the last row clears the home indicator / gesture bar by a
  comfortable margin. Some Android devices report `insets.bottom = 0` while a
  translucent 3-button nav bar (~48dp) still draws over the content, so the
  `Math.max` floor must be a full nav-bar height (48), not just breathing room.

## Edge scrims — the actual clash fix

Padding only helps at scroll end. At any other scroll position (including
scroll start when content slightly overflows), content draws **under** the
transparent status/nav bars and visually collides with their icons. That is
why every screen also renders `<EdgeScrims />` (`app/components/EdgeScrims.tsx`)
as the last child of the screen root, **after** the ScrollView: solid
`colors.bg` covers sized to `insets.top` / `insets.bottom` so content
disappears at the screen edges instead of clashing.

Any new screen must include it:

```tsx
<View style={sharedStyles.screen}>
  <ScrollView ...>...</ScrollView>
  <EdgeScrims />
</View>
```

If the clearance ever feels tight again, fix it **once** in
`screenEdgePadding` — never patch an individual screen.

## Fixed / absolutely-positioned elements

Anything anchored to a screen edge (floating button, sticky bar, toast) must
offset by the matching inset: `bottom: insets.bottom + space.*` or
`top: insets.top + space.*`. Never a bare pixel value.

## Checklist before finishing any screen/layout change

1. Screen uses `useSafeAreaInsets()` + `screenEdgePadding` — no hand-rolled
   inset math.
2. `scrollIndicatorInsets` set so the scrollbar doesn't run under the bars.
3. `RefreshControl` (if any) uses `progressViewOffset: insets.top + space.md`.
4. `<EdgeScrims />` rendered after the scroll view in the screen root.
5. Scroll to the very bottom mentally (or in the simulator): the last
   tappable element (e.g. the "Show N more stops" disclosure button) must sit
   clearly above the home indicator, not touching it.
6. New edge-anchored elements offset by insets.
