---
name: Nizam
description: Modern dark obsidian workspace — 4-color palette system (#f6e5c9, #e5f19d, #defef9, #dbd4fd), clean typography, rich contrast
colors:
  bg: "#0E0F14"
  surface: "#181922"
  surface-high: "#222432"
  text: "#FFFFFF"
  muted: "#8E92A0"
  border: "#282A38"
  primary: "#dbd4fd"
  success: "#e5f19d"
  warning: "#f6e5c9"
  info: "#defef9"
  danger: "#FB7185"
  palette:
    cream: "#f6e5c9"
    lime: "#e5f19d"
    mint: "#defef9"
    lavender: "#dbd4fd"
typography:
  display:
    fontFamily: System
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.15
  title:
    fontFamily: System
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: System
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: System
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "22px"
  full: "28px"
  tab: "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
  xxxl: "64px"
---

# Design System: Nizam (Modern Dark Precision)

## 1. Overview

**Creative North Star: "Precision Obsidian Quartet"**

Nizam uses a deep OLED dark theme (`#0E0F14`) anchored by a curated 4-color palette that appears immediately after the background:
- **Warm Cream (`#f6e5c9`)** — Warmth, elevated FAB action button, in-progress indicator, warm category theme
- **Pastel Lime (`#e5f19d`)** — Energy, completion/done status, streak/productivity metrics, chartreuse theme
- **Ice Mint (`#defef9`)** — Glacial serenity, upcoming events, calendar chips, checklist accents, aqua theme
- **Soft Lavender (`#dbd4fd`)** — Brand primary accent, To-Do status, active tabs, focus mode, lilac theme

## 2. Colors

### Dark Mode (Default)

| Token | Hex | Role | Text Contrast |
|-------|-----|------|---------------|
| bg | #0E0F14 | Obsidian base background (Preserved) | - |
| surface | #181922 | Cards and elevated containers | #FFFFFF |
| surfaceHigh | #222432 | Modals, sheets, inputs | #FFFFFF |
| text | #FFFFFF | Crisp pure white text | - |
| textMuted | #8E92A0 | Secondary & placeholder text | - |
| border | #282A38 | Subtle dark border / divider | - |
| primary / lavender | #dbd4fd | Soft Lavender — To Do, active tabs, focus | #23173D (Dark Plum) |
| success / lime | #e5f19d | Pastel Lime — Done, streak, completion | #16270E (Dark Forest) |
| warning / cream | #f6e5c9 | Warm Cream — In Progress, FAB, milestones | #2D1E0C (Dark Espresso) |
| info / mint | #defef9 | Ice Mint — Upcoming events, calendar chips | #0A2B3A (Dark Teal) |
| danger | #FB7185 | Coral Rose — overdue, critical alert | #FFFFFF |

### Harmonic Combinations

1. **Lavender + Lime (`#dbd4fd` & `#e5f19d`)**: Productivity Card (Lavender focus CTA + Lime streak flame).
2. **Lavender + Mint (`#dbd4fd` & `#defef9`)**: Upcoming Events Card (Lavender badge + Mint time chip) & Voice Hero Glow.
3. **Cream + Lavender (`#f6e5c9` & `#dbd4fd`)**: Monthly Overview Card (Cream badge + Lavender progress bar) & Bottom Bar (Cream FAB + Lavender tab active).
4. **Mint + Lime (`#defef9` & `#e5f19d`)**: Today's Checklist Card (Mint badge + Lime completion checks).
5. **Cream + Lime (`#f6e5c9` & `#e5f19d`)**: Dynamic progress pairing for task state workflows.
6. **Quad Aurora Gradient**: `['#f6e5c9', '#e5f19d', '#defef9', '#dbd4fd']` for ambient glows and project swatches.

### No Pure Black

Background is warm charcoal `#141518` in dark mode, never `#000000`. Text is `#F0EFEA` (warm off-white), never pure white.

## 3. Typography

System fonts only (SF Pro on iOS, Roboto on Android). No Inter, no Google Fonts, no decorative faces.

| Level | Size | Weight | Line | Use |
|-------|------|--------|------|-----|
| Display | 32px | 700 | 1.15 | Screen headings |
| Title | 20px | 600 | 1.25 | Card titles, modals |
| Body | 16px | 400 | 1.6 | Task text, descriptions |
| Label | 12px | 600 | 1.3 | Status, meta, tabs |

## 4. Elevation

Directional, tight, color-matched shadows. Three levels:

| Level | Value | Use |
|-------|-------|-----|
| sm | `0 1px 3px rgba(0,0,0,0.25)` | Cards, inputs |
| md | `0 2px 8px rgba(0,0,0,0.35)` | FAB, dropdowns |
| lg | `0 4px 16px rgba(0,0,0,0.45)` | Modals, sheets |

No neomorphic opposing shadows. No glow. No blur. Single-direction, single-color shadows that sit tight to the element.

## 5. The Signature: Active Trace

The currently focused item gets a 3px amber edge on one side (left in LTR, right in RTL). Like a highlighter stripe that says "this one." Applied to:
- Active task cards
- Active filter pills
- Active navigation tab (underline variant)

This is the single visual signature that makes Nizam recognizable.

## 6. Spacing Scale

Strict multiples: 4, 8, 16, 24, 32, 48, 64. No 12px. No 6px spacing (radius only, not spacing).

## 7. Components

### Buttons
- Primary: Amber fill, charcoal text, 20px radius, md shadow
- Secondary: Surface fill, ink text, 1px border, 10px radius
- Icon: 36x36, surface fill, border, 10px radius

### Cards
- Surface background, 14px radius, 1px border, sm shadow
- Active card gets 3px amber left/right edge

### Inputs
- Surface background, 1px border, 14px radius
- Focus: amber border, no ring

### Tab Bar
- Background matches page bg
- Active tab: amber color
- No shadow, no extrusion

## 8. Do's and Don'ts

### Do
- Do use amber exclusively for CTAs and the active trace
- Do use the spacing scale strictly (4/8/16/24/32/48/64)
- Do use system fonts only
- Do use bordered surfaces, not shadow-only separation
- Do keep body text at 65-75 characters per line
- Do support RTL with mirrored active trace

### Don't
- Don't use pure black `#000000` anywhere
- Don't use neomorphic opposing shadows
- Don't introduce second accent colors
- Don't use decorative gradients, glows, or pills
- Don't use Google Fonts or decorative faces
- Don't use 12px spacing
