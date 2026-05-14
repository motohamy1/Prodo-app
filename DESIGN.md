---
name: ToDoIt
description: Claymorphism task management — soft depth, warm tones, playful warmth
colors:
  warm-orange: "#FF7E3D"
  electric-lime: "#D4F82D"
  teal-mint: "#2DB886"
  warm-amber: "#E89300"
  clay-coral: "#E84A45"
  muted-blue: "#5BA0D9"
  milky-cream: "#FFF8F0"
  warm-white: "#FFFEF9"
  cream-border: "#F0E0CC"
  warm-brown: "#1E1814"
  muted-brown: "#8B7765"
  obsidian: "#0F0F12"
  slate-surface: "#1C1C21"
  cool-border: "#2C2C35"
  muted-lavender: "#9494B8"
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
    backgroundColor: "{colors.warm-orange}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "16px 24px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.warm-orange}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  button-icon:
    backgroundColor: "transparent"
    rounded: "{rounded.lg}"
    size: "36px"
  card-task:
    backgroundColor: "{colors.warm-white}"
    rounded: "{rounded.xl}"
    padding: "16px"
  input-field:
    backgroundColor: "{colors.warm-white}"
    textColor: "{colors.warm-brown}"
    rounded: "{rounded.lg}"
    padding: "16px"
  chip-badge:
    backgroundColor: "transparent"
    rounded: "{rounded.md}"
    padding: "4px 12px"
  chip-filter:
    backgroundColor: "{colors.warm-white}"
    rounded: "{rounded.md}"
    padding: "10px"
---

# Design System: ToDoIt

## 1. Overview

**Creative North Star: "The Plush Studio"**

ToDoIt feels like stepping into a sunlit creative studio furnished with soft clay objects: rounded, tactile, warmly lit. Every surface has substance — cards rise from the background like shaped clay, buttons compress under touch, and the milky cream canvas makes the whole space feel calm and inviting. The interface is a studio, not a warehouse.

The system uses claymorphism as its depth model: every raised surface casts a soft, diffuse shadow and wears a subtle inner highlight (lighter at the top-left, settling to base color at the bottom-right). This dual-shadow technique creates the illusion of puffy, inflated clay — surfaces feel substantial and touchable rather than flat or sharply raised. No hard 1px borders. No cold whites. No pure blacks.

This system explicitly rejects everything in PRODUCT.md's anti-references (enterprise clutter, SaaS-cream, gamified toys, brutalist posturing) and adds a clay-specific prohibition: no flat surfaces, no cold neutrals, no shadowless elevation.

**Key Characteristics:**
- Claymorphism depth model: dual shadows (soft outer + inner highlight) on every raised surface
- Warm milky cream light mode with tangerine orange accent; obsidian dark mode with electric lime
- Chunky, generous border radii (10px minimum, 26px for cards, 32px for navigation)
- Softer typography hierarchy: display at weight 700, titles at 600, with bold labels at 700 for contrast
- Task status expressed through warm clay surface tints (not flat colored backgrounds)
- RTL-aware with bidirectional text and flipped directional treatments

## 2. Colors

A warm, clay-adapted full palette. Five semantic roles anchored to warm tangerine orange (light) and electric lime (dark). Every neutral carries a yellow undertone — nothing is cool or gray. Backgrounds are milky cream; surfaces are warm whites; shadows are brown, not black.

### Primary
- **Warm Orange** (#FF7E3D): The light mode accent. Used for primary buttons, active tabs, selected states, the FAB, and the Today's Plan hero card. Carries 30-40% of light-mode surfaces at peak. Warm and energetic without being aggressive — orange, not red. Paired with warm-white text on filled buttons.
- **Electric Lime** (#D4F82D): The dark mode accent. Unchanged from the original system. High luminosity against obsidian backgrounds. Used for primary actions, selected tabs, and the FAB in dark mode.

### Tertiary
- **Teal Mint** (#2DB886): Success and completion. Warmer than the original teal — slightly shifted toward the yellow family. Used for done badges, completed progress rings, and success states. Dark mode: #00E096.
- **Warm Amber** (#E89300): Warning and in-progress. A deeper, warmer amber than the original. Used for in-progress badges and timer warnings. Dark mode: #FFB800.
- **Clay Coral** (#E84A45): Danger and overdue. A softer, warmer coral than the original. Never pure red. Used for delete buttons and not-done states. Dark mode: #FF5C77.
- **Muted Blue** (#5BA0D9): Information only. Desaturated from the original sky blue to feel less clinical. Used for info banners and links. Dark mode: #5CB2FF.

### Neutral
- **Milky Cream** (#FFF8F0): Light mode page background. The canvas. A warm off-white with subtle yellow undertone — never pure white, never gray. Reads as "cream" not "beige."
- **Warm White** (#FFFEF9): Light mode surface color (cards, inputs, modals). Slightly brighter than the cream background, creating lift through lightness rather than through cold contrast. Paired with the surface gradient (#FFFCF7 → #FFFEF9) for the clay inner highlight.
- **Cream Border** (#F0E0CC): Light mode borders and dividers. Warm enough to feel part of the palette, distinct enough to separate surfaces. Softer than the old slate border.
- **Warm Brown** (#1E1814): Light mode primary text. A warm dark brown — not pure black. Reads as confident and grounded.
- **Muted Brown** (#8B7765): Light mode secondary text. A warm brown-gray that feels organic rather than technical.
- **Obsidian** (#0F0F12): Dark mode background. Unchanged. The deepest surface.
- **Slate Surface** (#1C1C21): Dark mode card surface. Gets a clay inner highlight via the surface gradient (#24242B → #1C1C21).
- **Cool Border** (#2C2C35): Dark mode borders.
- **Muted Lavender** (#9494B8): Dark mode secondary text.

### Task Status Backgrounds (Clay-Surfaced)
Instead of flat color tints, each status background is a warm clay surface — a subtle, status-keyed tint that feels like colored clay rather than a paint overlay. All five are warm-shifted from their original values.
- In Progress: #FFF2E0 (warm clay orange) / #2B2000 (dark)
- Not Started: #F8F0E6 (warm cream) / #1C1C21 (dark)
- Done: #EAF5EC (warm clay teal) / #10261E (dark)
- Paused: #FDF0E0 (warm clay amber) / #201C14 (dark)
- Not Done: #FEEAE8 (warm clay coral) / #2B1014 (dark)

**The Warm/Cool Rule.** The accent shifts between warm orange (light mode) and electric lime (dark mode). Never use warm orange as a primary accent on dark backgrounds, and never use electric lime as a primary accent on light backgrounds. Both are committed accents in their respective modes — this is intentional, not inconsistent. Components consuming `colors.primary` resolve correctly per theme.

**The Clay Floor Rule.** Every neutral in the system carries a warm yellow undertone. No pure white (#FFFFFF), no pure black (#000000), no pure gray. These cold neutrals read as anti-clay — they feel flat, digital, and incompatible with the tactile clay depth model. Prohibited in all contexts.

**The Soft Signal Rule.** The four task-status semantic colors (teal, amber, coral, blue) appear as soft clay surface tints, not as hard-edged colored elements. A done task is a warm clay surface with teal depth, not a green card with a flat background.

## 3. Typography

**Display Font:** System default (SF Pro on iOS, Roboto on Android)
**Body Font:** System default with Inter override for card titles
**Label/Mono Font:** System default; Courier for version numbers

**Character:** Warm and approachable. The weight hierarchy is softer than the original: display headings at 700, titles at 600, body at 500. This gentler scale feels more tactile and less architectural — it matches the clay surfaces rather than cutting through them. Labels and badges stay bold at 700-800, creating clear information hierarchy through weight contrast rather than size excess.

### Hierarchy
- **Display** (700, 28px, 1.2): Screen-level headings: auth titles, section headers. Appears 1-2 times per screen maximum. Softer than the original weight 800 — feels inviting, not commanding.
- **Title** (600, 18-20px, 1.3): Card titles, modal titles, list item headings. The workhorse. Weight 600 sits comfortably between display and body, creating clear but gentle hierarchy. Uses Inter on iOS, sans-serif-medium on Android.
- **Body** (500, 15px, 1.5): Task text, descriptions, settings labels, form body copy. Unchanged from the original — weight 500 provides clean readability.
- **Label** (700-800, 12px, normal): Badges, tab labels, action button text, meta information. The bold counterpoint to softer headings — labels carry the visual energy that headings released.

**The Soft Head / Bold Label Rule.** Headings use weight 600-700 for a gentler, clay-matched presence. Labels, badges, and interactive text elements use weight 700-800 to maintain information hierarchy. Never use weight 400 or 300 — even at the softest, the system demands presence.

**The One-Third Rule.** All body copy maxes at 65-75 characters per line. Task descriptions, settings text, and form labels must not fill the full screen width.

## 4. Elevation

Claymorphism. Every raised surface casts two visual signals: a soft, diffuse outer shadow that suggests the surface is resting on the background, and a subtle inner highlight (a gradient lightening toward the top-left) that simulates light hitting the curved clay surface. The interaction between these two creates the puffy, inflated clay illusion.

**The Clay Depth Vocabulary:**

- **Cards / Surface Containers:** Soft outer shadow at elevation 3 (diffuse, warm-tinted in light mode) paired with a surface linear gradient that lightens 2-3% toward the top-left. Light mode shadow: `0 6px 20px rgba(184,134,11,0.12)`. Dark mode: `0 6px 20px rgba(0,0,0,0.25)`. This replaces the old sharp card shadows entirely.
- **Filter Pills (Active):** Subtle clay puff — a gentle outer shadow plus slight top-left highlight. The inactive pill is completely flat, creating a press-in/press-out interaction. No hard borders between pills.
- **Floating Action Button:** Pronounced clay depth. Elevated shadow at the accent color (`0 8px 24px` at warm orange 20% opacity in light, lime 30% opacity in dark). The surface gradient on the FAB itself creates the rounded clay illusion.
- **Bottom Sheet / Modals:** Deep clay raise. The modal sheet has a pronounced top-left inner highlight and a strong upward-spread shadow (`0 -12px 28px` at warm brown 15% opacity). The drag handle is a soft clay pill, not a sharp bar.

**The No Shadow, No Surface Rule.** Any interactive surface MUST have both the outer clay shadow and the inner highlight gradient at rest. Flat elements are static content only: section headers, divider lines, decorative text. If you can press it, it must have clay depth.

**The Soft Border Fallback.** Where borders were previously 1-1.5px solid lines, prefer depth differentiation instead. When a border is unavoidable (inputs, segmented controls), use a 1px line at 20-30% opacity of `colors.border` — never a hard solid stroke. Clay surfaces separate through depth, not lines.

## 5. Components

### Buttons
- **Primary (Filled):** Warm orange background (light) or electric lime (dark). Radius 20px. Height 56px (auth) or 42px (inline). Clay shadow at the accent color: `0 8px 24px` at 20-30% opacity. Surface gradient from lighter-accent (top-left) to base-accent (bottom-right). The heaviest clay surface on any screen.
- **Secondary (Outline):** Transparent background with 1px soft border at 30% opacity `colors.border`. Radius 16px, padding 12px horizontal. Text weight 600. Presses to a subtle clay indent (shadow shrinks to `0 2px 8px`).
- **Icon Button:** 36x36px circle at radius 18px (increased from 32px/16px). Transparent background with soft border on active state. Used for status toggles.
- **Dashed Border:** Subtask adder uses 1px dashed border at `colors.primary` with 30% opacity. Radius 16px. Signals "create here" without clay depth — the flatness invites filling.

### Chips / Badges
- **Status Badge:** Padding 4px vertical, 12px horizontal (wider than before), radius 16px. Background: 20% opacity of the status color over a warm tint. Text weight 700 at 12px. Never flat — badge backgrounds carry a subtle clay lift.
- **Filter Pill:** Padding 12px (increased from 10px), radius 16px. Active state: warm white surface with clay shadow and inner highlight. Inactive: flat warm cream. Transitions between states use a soft ease-out (200ms quart).

### Cards
- **Task Card:** Clay-surface background per status tint. Radius 26px (up from 20px). No 1px border — the clay shadow and inner highlight create separation. Padding 18px (up from 16px). Shadow: `0 6px 20px` warm brown 12% opacity. Task cards remain the primary interaction surface with progress ring, status badge, subtask count, timer controls, and action icons.
- **Today's Plan Card:** A committed orange surface — the full warm orange background. Radius 30px (up from 24px), padding 22px, white text. The most pronounced clay depth on the home screen. Used exactly once per screen.

### Inputs / Fields
- **Auth Input:** Height 56px, radius 20px, soft 1px border at `cream-border` 30% opacity. Background: warm white with clay surface gradient. Leading icon at 20px, text at 16px weight 500. Focus state adds a subtle orange glow-border (the only "glow" in the system — clay can get slightly brighter on focus).
- **Inline Subtask Input:** Padding 12px, radius 16px, warm cream background. Soft border at primary 20% opacity. Clay depth on the container, not the text field.

### Navigation
- **Tab Bar:** Absolute-positioned bottom bar with 32px top radius (unchanged). Background: warm cream (light) or near-black (dark). Active tab: warm orange or electric lime. Inactive: muted color. Labels at 12px weight 700. Tab bar has a soft top-clay shadow (-4px spread upward) rather than a hard border.
- **Header:** No default header. Custom header with date, greeting, and notification bell (44px circle, soft border, clay shadow on the bell).

### Progress / Indicators
- **Circular Progress:** SVG ring, unchanged structure (56px, stroke width 4). Filled arc in status-derived color, unfilled arc in warm cream (light) or surface tint (dark), at 10-15% opacity. Round end caps.
- **Linear Progress:** 6px height, radius 4px (up from 3px — chunky clay bar). Track: warm cream background. Fill: primary accent or success. Subtle inner highlight on the fill bar for clay depth.

## 6. Do's and Don'ts

### Do:
- **Do** apply both clay shadows (soft outer + inner highlight gradient) to every pressable surface at rest. Flat means static. Clay means interactive.
- **Do** use 20px as the minimum radius for any interactive surface and 26px for cards. The clay aesthetic depends on chunky, generous curves.
- **Do** use warm orange (`colors.primary` in light mode) for primary actions only — never as decoration. The orange accent is a signal, not a style.
- **Do** use warm, yellow-undertone neutrals exclusively. Milky cream, warm white, warm brown. No pure white, no pure black, no cold gray.
- **Do** use clay surface tints (colored clay backgrounds with subtle depth) for task status cards. Color communicates state before the user reads the badge text.
- **Do** keep body copy at 65-75 characters per line. Break at natural reading spans.
- **Do** pair softer headings (weight 600-700) with bold labels (weight 700-800). The weight gap creates hierarchy without excessive size differences.
- **Do** support RTL as a first-class layout direction. Directional padding uses `start`/`end`, text alignment respects writing direction, inner highlight gradients flip orientation for Arabic.

### Don't:
- **Don't** use hard 1px solid borders on any raised surface. Clay separates through depth, not lines. When borders are unavoidable, use 1px at 20-30% opacity.
- **Don't** use cold neutrals: pure white (#FFFFFF), pure black (#000000), pure gray (#808080, #999999, etc). Every neutral must carry a warm yellow-brown undertone.
- **Don't** use gradient text (`background-clip: text`). Emphasis through weight and size, not decorative fills.
- **Don't** use glassmorphism (backdrop blur + translucent backgrounds). Claymorphism is the depth model — don't mix depth metaphors.
- **Don't** leave any interactive surface shadowless at rest. If it's pressable, it has clay depth.
- **Don't** create identical card grids with icon + heading + text repeated endlessly. Every card should show its task status through clay surface color first.
- **Don't** default to modals for interactions that could be inline. The TodoCard handles inline creation, timer controls, and status changes. Reserve modals for full task detail editing and action sheets.
- **Don't** let the interface look like a cluttered enterprise tool (Jira/Asana density). Every screen should feel like a studio, not a data center.
- **Don't** drift toward the generic SaaS aesthetic. No white cards on pale gray backgrounds. No blue-dominant CTAs. No stock illustration style.
- **Don't** add gamification layers (points, streaks, level-ups, cartoon mascots). Delight comes from the clay tactility itself — the satisfying press animation, the warm color, the chunky rounded shapes.
- **Don't** hardcode color values in components. Always read from `useTheme().colors`. The warm orange / electric lime split depends on every component consuming the theme context.
- **Don't** use border-left or border-right greater than 1px as a colored accent stripe on any element. Use full clay surface tints instead — the entire card background shifts to signal status.
