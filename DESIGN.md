---
name: ToDoIt
description: Warm charcoal workspace — amber directional light, precision typography, zero decoration
colors:
  base-charcoal: "#141518"
  surface: "#1E1F23"
  surface-high: "#26272C"
  ink: "#F0EFEA"
  muted: "#7A7B7E"
  border: "#2A2B30"
  amber: "#E8960C"
  emerald: "#4ADE80"
  rose: "#F87171"
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
  lg: "14px"
  xl: "20px"
  full: "24px"
  tab: "20px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
  xxxl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.base-charcoal}"
    rounded: "{rounded.lg}"
    padding: "16px 24px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    border: "1px {colors.border}"
  card-task:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "16px"
    border: "1px {colors.border}"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
    border: "1px {colors.border}"
---

# Design System: ToDoIt (v2)

## 1. Overview

**Creative North Star: "The Warm Command"**

ToDoIt v2 is a dark-first precision workspace. Like a finely lit desk at night — focused, warm, intentional. The system replaces the v1 neomorphic monochrome with a warm charcoal palette anchored by a single amber accent. Every surface is deliberate; every interaction feels like engaging a tool, not operating a machine.

The old system relied on extrusion depth to carry information (neomorphism). The new system relies on typographic hierarchy, a disciplined color palette, and one signature visual move: the active trace — a 3px amber edge on the currently focused item that says "this one."

**Key Characteristics:**
- Dark-first warm charcoal palette (`#141518` base), not pure black
- Single amber accent (`#E8960C`) reserved for CTAs and the active trace
- Emerald success, rose danger — semantic colors with real hue
- Tight, directional shadows (not neomorphic opposing shadows)
- Clean bordered surfaces instead of extrusion depth
- System fonts only — no Google Fonts, no decorative faces
- Proper modular type scale: 12/14/16/20/24/32
- Strict spacing scale: 4/8/16/24/32/48/64
- RTL first-class support preserved

## 2. Colors

### Dark Mode (Default)

| Token | Hex | Role |
|-------|-----|------|
| bg | #141518 | Page background — warm deep charcoal |
| surface | #1E1F23 | Cards, elevated surfaces |
| surfaceHigh | #26272C | Modals, sheets |
| text | #F0EFEA | Warm off-white ink |
| textMuted | #7A7B7E | Secondary, placeholders |
| border | #2A2B30 | Subtle separators |
| primary | #E8960C | Amber — CTAs, active trace |
| primaryText | #141518 | Dark text on amber |
| success | #4ADE80 | Emerald — done, completed |
| warning | #E8960C | Amber — in progress |
| danger | #F87171 | Rose — overdue, destructive |
| shadow | #0A0A0C | Shadow base color |

### Light Mode

| Token | Hex | Role |
|-------|-----|------|
| bg | #FAF8F5 | Warm cream |
| surface | #FFFFFF | Cards |
| surfaceHigh | #FFFFFF | Modals |
| text | #1E1F23 | Near-black ink |
| textMuted | #8B8D91 | Muted |
| border | #E8E5E0 | Subtle borders |
| primary | #D68D0A | Amber |
| primaryText | #FFFFFF | White on amber |
| success | #16A34A | Green |
| warning | #D68D0A | Amber |
| danger | #DC2626 | Red |

### The Single Accent Rule

Exactly one accent color: amber. Used for primary CTAs, the active trace, and progress indicators. Never used for decoration.

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

This is the single visual signature that makes ToDoIt recognizable.

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
