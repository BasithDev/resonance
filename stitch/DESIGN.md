---
name: Resonance
colors:
  surface: '#141315'
  surface-dim: '#141315'
  surface-bright: '#3a393b'
  surface-container-lowest: '#0f0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f21'
  surface-container-high: '#2b292c'
  surface-container-highest: '#363436'
  on-surface: '#e6e1e4'
  on-surface-variant: '#e2bebb'
  inverse-surface: '#e6e1e4'
  inverse-on-surface: '#313032'
  outline: '#a98987'
  outline-variant: '#5a403f'
  surface-tint: '#ffb3af'
  primary: '#ffb3af'
  on-primary: '#68000d'
  primary-container: '#ff5959'
  on-primary-container: '#60000b'
  inverse-primary: '#b6232b'
  secondary: '#c6c6c7'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b4b5b5'
  tertiary: '#5adcb2'
  on-tertiary: '#003829'
  tertiary-container: '#00a780'
  on-tertiary-container: '#003325'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad7'
  primary-fixed-dim: '#ffb3af'
  on-primary-fixed: '#410005'
  on-primary-fixed-variant: '#930017'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#79f9cd'
  tertiary-fixed-dim: '#5adcb2'
  on-tertiary-fixed: '#002117'
  on-tertiary-fixed-variant: '#00513d'
  background: '#141315'
  on-background: '#e6e1e4'
  surface-variant: '#363436'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1440px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  unit-xs: 4px
  unit-sm: 8px
  unit-md: 16px
  unit-lg: 32px
  unit-xl: 64px
---

## Brand & Style
The design system is engineered for high-fidelity immersion within the music and entertainment space. It adopts a **Minimalist-Editorial** aesthetic, characterized by a near-black canvas that allows vibrant album art and the coral-red accent to command attention. 

The personality is professional, dark, and sleek, mimicking the focused experience of a high-end recording studio. It prioritizes content-first layouts with generous negative space, ensuring the interface remains unobtrusive during long listening sessions. The visual narrative relies on high contrast and crisp geometry to create a sophisticated, premium digital environment.

## Colors
The palette is centered around a "Dark Mode First" philosophy. 

- **Background (#1c1b1d):** The primary canvas, providing a deep, non-distracting foundation.
- **Accent (#ff5959):** A high-energy coral red used exclusively for primary interactions, playback progress, and active states.
- **Surfaces:** Tiered shades of dark gray are used to create structural depth for sidebars and player controls.
- **Typography:** Pure white (#ffffff) is reserved for high-priority headlines, while a mid-tone gray is used for secondary metadata (artist names, timestamps) to maintain a clear visual hierarchy.

## Typography
This design system utilizes **Inter** for its systematic clarity and modern edge. 

- **Headlines:** Set with tight tracking and heavy weights (Bold to Black) to create an editorial feel that mimics music magazine layouts.
- **Scalability:** Larger headlines scale down significantly on mobile to ensure long track titles do not wrap awkwardly.
- **Labels:** Small, uppercase labels with increased letter-spacing are used for categorization (e.g., "ALBUM", "PLAYLIST", "FOLLOWERS") to provide a distinct stylistic counterpoint to the heavy headlines.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a sidebar-main content architecture.

- **Desktop:** A 12-column grid with a fixed-width left navigation (280px) and a fluid content area. 40px margins ensure the content doesn't feel cramped.
- **Mobile:** A single-column flow with 16px margins. The bottom playback bar remains persistent and occupies the full width.
- **Rhythm:** An 8px linear scale governs all padding and margins. Vertical spacing between sections (e.g., between "Recently Played" and "Made For You") should default to `unit-xl` (64px) to maintain the editorial breathability.

## Elevation & Depth
In this design system, depth is achieved through **Tonal Layers** and **Subtle Glows** rather than traditional drop shadows.

- **Z-Index 0 (Background):** #1c1b1d.
- **Z-Index 1 (Cards/Sidebar):** #252426.
- **Z-Index 2 (Modals/Hover):** #333134.
- **Accent Depth:** Interactive elements like the "Play" button or the active playback progress bar feature a soft coral-red outer glow (15% opacity, 20px blur) to simulate a light-emitting diode (LED) effect.
- **Borders:** Use low-contrast 1px strokes (#333134) to define boundaries between sections without introducing visual noise.

## Shapes
The shape language is consistently **Rounded**, emphasizing comfort and modern hardware aesthetics (reminiscent of contemporary smartphones and tablets).

- **Standard Elements:** Buttons, inputs, and small cards use a 0.5rem (8px) radius.
- **Containers:** Large album art, playlist hero banners, and main modal containers use `rounded-lg` (16px) to create a distinct, framed look.
- **Circular Elements:** Profile avatars and round "Play" buttons are always set to 50% (pill-shaped/circular).

## Components
- **Buttons:** Primary buttons are solid coral-red with white text. Secondary buttons are outlined with a 1px white stroke or semi-transparent gray fill.
- **Music Cards:** Album art cards must have a 16px radius. On hover, the image should slightly scale (1.05x) with a play icon overlay appearing in the center.
- **Input Fields:** Dark surfaces (#252426) with no borders until focused. Upon focus, a 1px coral-red border is applied.
- **List Items:** Track lists use a transparent background that transitions to #333134 on hover. The track number is replaced by a mini-visualizer or a play icon when the item is active.
- **Progress Bars:** The background rail is a dark gray (#333134), and the progress indicator is coral-red. The thumb (scrubber) only appears on hover to maintain a clean aesthetic.
- **Visualizer:** A dynamic 3-bar animated icon used for the "Now Playing" state, rendered in the accent color.