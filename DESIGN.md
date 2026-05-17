---
name: ToDoIt
description: Neomorphic task management — monochrome, extruded depth, architectural precision
colors:
  base-gray: "#E4E4E4"
  raised-gray: "#ECECEC"
  inset-gray: "#D8D8D8"
  dark-text: "#2D2D2D"
  muted-text: "#8C8C8C"
  accent-steel: "#4A4A4A"
  obsidian: "#2D2D30"
  dark-raised: "#36363A"
  dark-inset: "#242428"
  dark-accent: "#CCCCCC"
typography:
  display:
    fontFamily: System
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Inter, sans-serif-medium"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: System
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: System
    fontSize: "12px"
    fontWeight: 700
rounded:
  sm: "10px"
  md: "16px"
  lg: "20px"
  xl: "26px"
  full: "30px"
  tab: "32px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent-steel}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "16px 24px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.dark-text}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  button-icon:
    backgroundColor: "transparent"
    rounded: "{rounded.lg}"
    size: "36px"
  card-task:
    backgroundColor: "{colors.raised-gray}"
    rounded: "{rounded.xl}"
    padding: "18px"
  input-field:
    backgroundColor: "{colors.inset-gray}"
    textColor: "{colors.dark-text}"
    rounded: "{rounded.lg}"
    padding: "16px"
  chip-badge:
    backgroundColor: "transparent"
    rounded: "{rounded.md}"
    padding: "4px 12px"
  chip-filter:
    backgroundColor: "{colors.raised-gray}"
    rounded: "{rounded.md}"
    padding: "10px"
---

# Design System: ToDoIt

## 1. Overview

**Creative North Star: "The Machined Object"**

ToDoIt feels like a precision instrument milled from a single block of material. Every surface extrudes from or recedes into the background with surgical exactness. There is no warmth, no playfulness, no decoration. The interface is an architectural object: every pixel is structural, every shadow is load-bearing, every interaction feels like engaging a finely calibrated mechanism.

The system uses classic neomorphism as its depth model: every raised surface casts a sharp dark shadow on one side and receives a bright highlight on the opposite side, creating the illusion of material extruded from a uniform substrate. Pressed elements invert this relationship — they recede into the surface. Flat elements remain flush with the background. No soft clay shadows, no warm creams, no puffy inflated surfaces. This is neomorphism at its most disciplined: monochrome, architectural, and deliberately austere.

This system explicitly replaces the previous claymorphism direction (warm creams, soft diffuse shadows, playful personality) with a rigorous, sophisticated alternative. All claymorphism rules, colors, and depth models are superseded.

**Key Characteristics:**
- Classic neomorphic depth: sharp opposing shadows (dark + light) on every raised surface
- Full monochrome gray scale: no semantic colors, no warmth, no coolness — pure tonal variation
- Status conveyed through extrusion depth and typography, never through hue
- Extruded buttons that visibly depress on press, surfaces that lift on hover
- Generous border radii maintained (10px minimum, 26px for cards, 32px for navigation)
- Typographic hierarchy carries information weight that color previously held
- RTL-aware with bidirectional shadow mirroring
- Dark mode receives identical neomorphic treatment with light-on-dark extrusion

## 2. Colors

A full monochrome gray scale. Every "color" is a tonal variation of the same neutral base. Five semantic roles map to distinct positions on the tonal scale — they are distinguishable through lightness contrast, not hue. The system has exactly one muted accent (`accent-steel` / `dark-accent`) reserved for primary CTAs; it reads as gray at a glance but carries just enough chromatic character to signal "action."

### Primary Accent (Single, Deliberate)

- **Steel Gray** (#4A4A4A): Light mode CTA. The darkest tone on the page. Used for primary buttons, the FAB, and the Today's Plan card. Against the #E4E4E4 background, it reads as authoritative without being colorful. Paired with white text on filled surfaces.
- **Light Steel** (#CCCCCC): Dark mode CTA. The lightest tone on the obsidian surface. Same role, opposite end of the tonal spectrum.

### Semantic Tones (Status, All Monochrome)

Each semantic role occupies a fixed position on the lightness scale. None carry chromatic information. They are distinguishable side-by-side but subtle in isolation — the user learns the depth language, not the color language.

| Role | Light Mode | Dark Mode | Meaning |
|------|-----------|-----------|---------|
| Success | #555555 | #AAAAAA | Done, completed |
| Warning | #666666 | #999999 | In progress, active |
| Danger | #777777 | #888888 | Overdue, not done |
| Info | #999999 | #777777 | Informational |

### Neutral Tonal Scale

| Token | Light Mode | Dark Mode | Role |
|-------|-----------|-----------|------|
| Background | #E4E4E4 | #2D2D30 | Page background, the substrate |
| Surface Raised | #ECECEC | #36363A | Extruded cards, buttons at rest |
| Surface Inset | #D8D8D8 | #242428 | Inputs, pressed states, embossed areas |
| Surface Flat | #E4E4E4 | #2D2D30 | Static content, flush with background |
| Border | #D0D0D0 | #404045 | Separators, input strokes (minimal use) |
| Text Primary | #2D2D2D | #FFFFFF | Body text, headings |
| Text Secondary | #8C8C8C | #A0A0A0 | Metadata, placeholders, muted content |

### Task Status Backgrounds (Tonal Extrusion)

Instead of colored backgrounds, each status is a distinct position on the extrusion spectrum:

- **In Progress**: #ECECEC (light) / #36363A (dark) — Maximum extrusion. The most raised surface. Boldest typography. The task demands attention through depth alone.
- **Not Started**: #E4E4E4 (light) / #2D2D30 (dark) — Flush with background. Neutral. The default resting state.
- **Done**: #DADADA (light) / #28282C (dark) — Slightly inset. Embossed into the background. Strikethrough text. The task has receded.
- **Paused**: #E8E8E8 (light) / #323236 (dark) — Moderate extrusion. Distinct from in-progress, less commanding.
- **Not Done / Overdue**: #DEDEDE (light) / #303034 (dark) — Slightly darker than not-started. The shift is subtle but registered.

**The Monochrome Rule.** No hue variation anywhere. Every "color" in the system is a gray — the only variable is lightness. The accent steel gray carries a hint of blue-gray character (chroma < 0.005 in OKLCH) but reads as monochrome in context. If two elements look like the same gray, they might need more lightness separation. If any element reads as "colored," it has strayed from the system.

**The Depth-Is-Information Rule.** In the absence of color, extrusion depth carries semantic meaning. More raised = more important or more active. Receded = completed or disabled. Flat = neutral or static. The user learns to read the third dimension.

**The Single Accent Rule.** Exactly one tone is reserved for primary actions. It is the darkest gray in light mode and the lightest gray in dark mode. It marks the single most important action on any screen. Never use it for decoration, never use it twice on the same surface unless both are equally primary, and never introduce a second accent color.

## 3. Typography

**Display Font:** System default (SF Pro on iOS, Roboto on Android)
**Body Font:** System default with Inter override for card titles
**Label/Mono Font:** System default

**Character:** Precise and architectural. Typography carries the information weight that color previously held. Weight contrast is the primary hierarchy mechanism since color contrast is absent. The scale is deliberate and restrained — every weight step communicates a meaningful distinction.

### Hierarchy

- **Display** (700, 28px, 1.2): Screen-level headings: auth titles, section headers. Appears 1–2 times per screen maximum. Bold enough to be structural.
- **Title** (600, 18px, 1.3): Card titles, modal titles, list item headings. The workhorse. Sufficient weight to carry hierarchy without shouting.
- **Body** (500, 15px, 1.5): Task text, descriptions, settings labels, form body copy. The baseline. Everything reads from here.
- **Label** (700, 12px, normal): Badges, tab labels, action button text, meta information. The bold counterpoint that creates textural variety in the monochrome space.

**The Weight-Is-Color Rule.** Where the previous system used warm orange to signal importance, this system uses weight contrast. A heading at 700 carries the same "look at me" signal that orange once did. Labels at 700 create the textural punch that colorful badges once provided. Never use weight 400 or 300 — even at the lightest, the system demands presence.

## 4. Elevation

Classic neomorphism. Every raised surface produces two visual signals: a dark shadow cast downward-right and a light highlight cast upward-left. The interaction between these creates the illusion of material extruded from a uniform substrate. Pressed/active elements invert the relationship — the dark shadow moves to the top-left and the highlight moves to the bottom-right, simulating a depression.

**The Neomorphic Depth Vocabulary:**

- **Raised (Default):** Dark shadow at bottom-right, light highlight at top-left. Surface is lighter than background. Used for cards, filter pills (active), and action buttons at rest. Shadow: `6px 6px 12px #B0B0B0, -6px -6px 12px #FFFFFF` (light mode), `6px 6px 12px #1A1A1C, -6px -6px 12px #404044` (dark mode).

- **Raised Large:** Pronounced extrusion. Stronger offsets, wider spread. Used for the Today's Plan card, FAB, and modal sheets. Shadow: `8px 8px 16px #B0B0B0, -8px -8px 16px #FFFFFF` (light), `8px 8px 16px #1A1A1C, -8px -8px 16px #404044` (dark).

- **Pressed (Active/Inset):** Shadows invert direction and move inside. Surface darkens slightly. Used for pressed buttons, active filter pills, and done task cards. Shadow: `inset 4px 4px 8px #B0B0B0, inset -4px -4px 8px #FFFFFF` (light), `inset 4px 4px 8px #1A1A1C, inset -4px -4px 8px #404044` (dark).

- **Flat:** No shadows. Surface matches background. Used for static content, inactive filter pills, section headers, and the tab bar background.

**The No Shadow, No Interaction Rule.** Any interactive surface MUST cast a neomorphic shadow at rest. Flat means non-interactive. If you can press it, it extrudes. Pressing it inverts to inset.

**The Tonal Separation Rule.** Raised surfaces must be at least 2% lighter than the background in light mode and 3% lighter in dark mode to register the extrusion. Borders are disfavored — depth creates separation, not lines.

**RTL Shadow Mirroring.** In Arabic/RTL mode, the light source is presumed to come from top-right rather than top-left. All shadow offsets flip horizontally: dark shadow moves to bottom-left (`width: -6`), light highlight moves to top-right (`width: 6`). This maintains the material illusion across writing directions.

## 5. Components

### Buttons

- **Primary (Filled):** Steel gray background (light) or light steel (dark). Radius 20px. Height 56px (auth) or 42px (inline). Raised neomorphic shadow. Surface matches the `raised` extrusion. Text in white (light) or obsidian (dark). The most authoritative element on any screen.
- **Secondary (Outline):** Transparent background. 1px border at `border` color. Radius 16px. Text weight 600. Presses to inset state.
- **Icon Button:** 36x36px circle at radius 18px. Transparent at rest, subtle raised shadow on hover/active. Used for status toggles, action icons.
- **Dashed Border:** Subtask adder uses 1px dashed border at accent tone. Radius 16px. Flat — signals "create here" without depth.

### Chips / Badges

- **Status Badge:** Padding 4px vertical, 12px horizontal, radius 16px. Background: `surface raised` with subtle raised shadow. Text weight 700 at 12px. Badges communicate status through position and weight, since color is absent. The badge background is tonally distinct from the card it sits on.
- **Filter Pill:** Padding 12px, radius 16px. Active state: raised surface with neomorphic shadow. Inactive: flat, matches background. Press toggles between extruded and flat — the depth change IS the state change.

### Cards

- **Task Card:** Neomorphic raised surface. Radius 26px. Background determined by task status extrusion level (see Task Status Backgrounds). Shadow: `6px 6px 12px` dark + `-6px -6px 12px` light. No border. Cards separate from the background through depth alone. Each card is an extruded object resting on the monolithic substrate — not a "card" in the traditional UI sense, but a structural element of the surface itself.
- **Today's Plan Card:** Raised Large surface in steel gray. Radius 30px. White text on dark gray background (light mode). The most pronounced extrusion on the home screen. Used exactly once.

### Inputs / Fields

- **Auth Input:** Height 56px, radius 20px. Background: `surface inset` (darker than background — embossed). No border — the inset shadow creates the field boundary. Leading icon at 20px, text at 16px weight 500. Focus deepens the inset shadow. The field IS the depression.
- **Inline Input:** Padding 12px, radius 16px. Inset surface. No border. The depression invites typing.

### Navigation

- **Tab Bar:** Absolute-positioned bottom bar with 32px top radius. Background: flat surface (matches background). Active tab: extruded raised surface (pops forward). Inactive: flat. The active tab physically extrudes from the bar — no color highlight needed. Labels at 12px weight 700.
- **Header:** No default header. Custom header with date, greeting, and notification bell (44px circle, raised shadow on the bell).

### Progress / Indicators

- **Circular Progress:** SVG ring, 56px, stroke width 4. Track: inset surface (darker ring). Fill: extruded surface (lighter arc with raised shadow illusion). Round end caps. The fill appears to extrude from the track — depth shows progress.
- **Linear Progress:** 6px height, radius 4px. Track: inset surface. Fill: raised surface. Subtle inner shadow on the fill bar.

## 6. Do's and Don'ts

### Do:

- **Do** apply opposing neomorphic shadows (dark + light) to every interactive surface at rest. Flat means static. Extruded means pressable.
- **Do** differentiate task status through extrusion depth: raised = active, inset = done, flat = not started. Let the third dimension carry information.
- **Do** use the single steel gray accent exclusively for primary CTAs. It is the darkest (light mode) or lightest (dark mode) tone on the page.
- **Do** use typographic weight contrast aggressively. In the absence of color, weight IS hierarchy.
- **Do** maintain the tonal separation rule: raised surfaces must be at least 2% lighter (light mode) or 3% lighter (dark mode) than the background.
- **Do** keep body copy at 65–75 characters per line.
- **Do** support RTL as a first-class layout direction. Mirror all shadow offsets horizontally. Mirror directional padding. Mirror icon directions.
- **Do** use 10px minimum radius for interactive surfaces and 26px for cards. The neomorphic effect demands generous curves.

### Don't:

- **Don't** introduce any chromatic color. No warm oranges, no electric limes, no teal greens, no coral reds. The palette is monochrome gray. The single accent carries only a hint of blue-gray character.
- **Don't** use hard 1px solid borders on raised surfaces. Neomorphic depth separates elements through shadow, not lines. Borders are reserved for inset inputs and secondary buttons.
- **Don't** use glassmorphism, claymorphism, or any mixed depth metaphor. Classic neomorphism only. One depth model, consistently applied.
- **Don't** make flat surfaces interactive. If it doesn't cast a shadow, it doesn't respond to touch.
- **Don't** leave shadowless interactive elements at rest. The shadow IS the affordance.
- **Don't** vary colors between light and dark mode in a way that breaks the monochrome rule. The accent may shift between dark gray (light mode) and light gray (dark mode) — that shift is tonal, not chromatic.
- **Don't** create identical card grids with uniform depth. Cards should vary in extrusion based on their content's status and importance.
- **Don't** default to modals for interactions that can be inline. Reserve modals for full-screen task editing.
- **Don't** add gamification, streaks, points, or decorative elements. The satisfaction comes from the mechanical precision of the interface itself.
- **Don't** hardcode shadow values in components. Always derive shadows from `colors.neomorphic`. Use the RTL-aware shadow mirroring for Arabic mode.
- **Don't** use border styling (left/right solid borders over 1px) as status indicators. Extrusion depth IS the status indicator.
