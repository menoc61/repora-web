---
name: Repora Sovereign
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b1c30'
  on-tertiary-container: '#75859d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
  ai-vibrant: '#2563EB'
  ai-glow: '#DBEAFE'
  status-draft: '#94A3B8'
  status-review: '#F59E0B'
  status-final: '#10B981'
  surface-studio: '#F8FAFC'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  sidebar-width: 280px
  inspector-width: 320px
  gutter: 24px
  margin-desktop: 32px
  container-max: 1200px
---

## Brand & Style

The design system is engineered for **Repora**, an enterprise-grade AI collaborative document platform. The brand personality is **authoritative, precise, and sophisticated**, evoking a sense of "sovereign intelligence" suitable for high-stakes departments like Legal, Engineering, and Finance.

The chosen style is **Corporate / Modern** with a focus on **High-Density Information Architecture**. It prioritizes utilitarian efficiency without sacrificing aesthetic refinement. The UI utilizes a structured, systematic approach characterized by:
- **Functional Minimalism:** Eliminating visual noise to focus on collaborative block editing and AI orchestration.
- **Technical Precision:** Using subtle borders and systematic spacing to define complex data relationships.
- **Trust-Oriented Aesthetics:** A professional "Desktop First" feel that avoids the "floaty" nature of web SaaS in favor of grounded, stable interface elements.

## Colors

The palette is anchored in **Deep Navy (#0F172A)** to project stability and institutional trust. 

- **Primary:** The deep navy is used for structural navigation, primary headings, and grounding elements.
- **Secondary (AI Blue):** A vibrant "AI Blue" serves as the primary action color and indicates AI-augmented features (generation, agent presence, and multi-agent orchestration).
- **Neutral/Slate:** A wide range of slate grays handles high-density text and secondary UI controls.
- **Surface Strategy:** The default mode is `light`, using a soft `surface-studio` (#F8FAFC) background to reduce eye strain during long-form document creation, while maintaining high contrast for legibility.

## Typography

This design system uses a triple-font strategy to balance editorial clarity with technical precision:
1. **Geist (Headlines):** A modern, technical sans-serif used for structural headers and the application shell.
2. **Inter (Body):** Optimized for long-form readability within the block editor.
3. **JetBrains Mono (Labels/Metadata):** Used for AI "thoughts," document metadata, version history timestamps, and system status to emphasize the algorithmic nature of the platform.

Text scaling is conservative to support high-density layouts. **Line heights** are generous for body text (1.5x - 1.6x) to facilitate scanning of long documents, but tighter for UI labels (1.2x) to maximize vertical space in sidebars and property panels.

## Layout & Spacing

The design system employs a **Fixed-Fluid Hybrid Grid** specifically tailored for a 3-pane desktop application:
- **Left Sidebar (Fixed):** 280px. Contains document navigation and workspace switching.
- **Central Editor (Fluid):** The primary focus. Max-width of 800px for optimal reading line lengths, centered within the remaining space.
- **Right Inspector (Fixed):** 320px. Contains AI Agent controls, collaboration presence, and block settings.

**Spacing Rhythm:**
A strict 4px base unit is used. High-density components (like the document tree) use `1x` or `2x` units, while layout-level margins use `6x` (24px) or `8x` (32px). Gutters are maintained at a consistent 24px to ensure distinct visual separation between the editor and the AI controls.

## Elevation & Depth

To maintain a "high-trust" enterprise feel, the system avoids dramatic shadows in favor of **Tonal Layers** and **Refined Strokes**:

- **Z-Index 0 (Base):** The `surface-studio` background.
- **Z-Index 1 (Surface):** The main editor canvas and sidebar backgrounds, separated by a 1px border (`#E2E8F0`).
- **Z-Index 2 (Elevation):** Floating AI toolbars and context menus. These use a very subtle, large-radius ambient shadow: `0 4px 20px -2px rgba(15, 23, 42, 0.08)`.
- **Active State Depth:** Selected blocks or active AI agents are highlighted with a 2px "AI Blue" left-accent border rather than elevation, maintaining the flatness and speed of the interface.

## Shapes

The shape language is **Soft (0.25rem)**. This slight rounding provides a professional, modern feel that is more approachable than sharp corners but more serious than highly rounded "consumer" styles.

- **Standard Elements:** Buttons, inputs, and chips use a 4px (0.25rem) radius.
- **Containers:** Large panels like the AI inspector or document cards use 8px (0.5rem).
- **Interactive States:** Focus rings and hover states should mirror the underlying element's roundedness exactly, with a 2px offset.

## Components

### Buttons & Inputs
- **Primary Action:** Solid Deep Navy or AI Blue for AI-related triggers. High contrast, bold weight.
- **Ghost Actions:** Transparent background with 1px slate borders for secondary document controls.
- **Inputs:** Minimalist with a 1px border. Focus state uses a 2px AI Blue ring without glowing effects to maintain the "clean" aesthetic.

### AI Multi-Agent Orchestrator
- **Agent Chips:** Small, mono-spaced labels using `label-sm` typography. Each agent should have a distinct color-coded dot status (Idle, Thinking, Writing).
- **Wave Progress:** Slim 4px height progress bars for parallel AI tasks, using the AI Blue accent.

### Collaborative Editor (BlockNote)
- **Block Hover:** A subtle `#F1F5F9` background change on the active block.
- **Presence Cursors:** Thin vertical lines with a top-aligned label showing the collaborator's name in `label-sm` font.
- **AI Inline Assist:** A floating, translucent bar that appears at the end of a block, using a 1px AI Blue border.

### Documentation Management
- **Status Badges:** Small caps, mono-spaced text in gray, amber, or emerald backgrounds with low opacity (10-15%).
- **Tree View:** High-density list with 4px vertical padding between items, using chevron icons for nesting.