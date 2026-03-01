# FlexMe Design System — MASTER v6.0 (Royal Gold VIP)

> Official Brand Identity System — Royal Gold VIP
> Target: Mobile-first PWA | Dark mode default | English-first, 6 languages
> Stack: Next.js 14 + TailwindCSS + Framer Motion

---

## 1. BRAND IDENTITY

| Property | Value |
|----------|-------|
| Name | FlexMe |
| Domain | flexmenow.com |
| Logotype | "Flex" white #FFFFFF + "Me" gold #F59E0B, Inter Black Italic |
| Symbol | Zap (lightning bolt) icon, filled #F59E0B, glow shadow |
| Logo Effect | `drop-shadow(0 0 15px rgba(245,158,11,0.5))` |
| Voice | Supreme confidence, luxury meets Gen Z energy |
| Slogan | "Flex your dream life" |
| Sub-slogan | "Glow up, naturally" (FlexLocket) |
| Brand color | Royal Gold #F59E0B — Zap Amber |
| Brand names | NEVER translated: FlexMe, FlexLocket, FlexShot, FlexTale |

---

## 2. COLOR SYSTEM

### 2.1 Primary — Royal Gold (Zap Amber)

```
Primary Gold (Zap Amber):     #F59E0B   ★ PRIMARY — Logo, CTAs, brand accent
Secondary Gold (Burnt Amber): #B45309   — depth, shadow, border, pressed state
Light Gold:                    #FBBF24   — hover state, highlights
```

### 2.2 Backgrounds

```
Luxury Black:    #050505   ★ PRIMARY BG — OLED black, makes gold pop
Surface Dark:    #121212   — Cards, bottom nav, elevated surfaces
Input Dark:      #1A1A1A   — Inputs, nested cards
```

### 2.3 Secondary Colors

```
Deep Purple (FlexTale accent):
  Purple 500:  #7C3AFF   ★ FlexTale accent
  Purple 600:  #6D28D9

Electric Blue:
  Blue 500:    #3B82F6   ★ Info, secondary actions
```

### 2.4 Feature Colors

```
FlexLocket:  White/Silver   — clean, minimal, camera purity
FlexShot:    Gold #F59E0B   — fire, trending, explosion (matches brand)
FlexTale:    Purple #7C3AFF — layered, deep, story depth
AI Enhance:  Silver/White   — magic, sparkle, intelligence
```

### 2.5 Premium Gradients (VIP)

```
Royal Flare:     linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #B45309 100%)
                 — 3-stop gradient for CTA buttons, VIP cards, onboarding
Dark Gold Glow:  radial-gradient(circle at center, rgba(245,158,11,0.15) 0%, rgba(5,5,5,1) 70%)
                 — Ambient glow for splash, backgrounds
Golden Glass:    linear-gradient(to bottom right, rgba(255,255,255,0.1), rgba(245,158,11,0.05))
                 — Frosted glass effect for overlays, premium UI
Story:           linear-gradient(135deg, #B45309 0%, #78350F 100%)
                 — Dark gold depth for story cards
```

### 2.6 Text Colors (Dark Mode)

```
text-primary:    #FFFFFF     (headings, main — pure white on luxury black)
text-secondary:  #A3A3A3     (descriptions, labels)
text-tertiary:   #525252     (placeholders, hints)
text-inverse:    #000000     (text on gold buttons — black on gold)
text-brand:      #F59E0B     (brand accent text)
text-link:       #FBBF24     (interactive text, light gold)
```

### 2.7 Borders

```
border-subtle:  rgba(255,255,255,0.06)
border-medium:  rgba(255,255,255,0.10)
border-gold:    rgba(245,158,11,0.20)   (gold accent border for VIP elements)
```

### 2.8 Semantic Colors

```
Success:    #10B981  (completed, saved)
Warning:    #B45309  (low credits — burnt amber)
Error:      #EF4444  (failed, error)
Info:       #3B82F6  (informational)
```

---

## 3. TYPOGRAPHY

### 3.1 Font Stack

```
Primary:     "Inter", sans-serif               — body, UI, buttons, labels, AND titles
Display:     "Inter" Black (900) Italic        — brand impact (FLEXME, FLEXSHOT, headings)
Monospace:   "JetBrains Mono", monospace       — credits, AI data, metadata, tech strings
CJK:         "Noto Sans JP" / "Noto Sans KR"  — fallback for JA/KO
```

### 3.2 Type Scale

```
Display XL:     36px / 44px / Bold 700        — Splash logo
Display Large:  32px / 40px / Bold 700        — Hero text
Display Medium: 28px / 36px / Bold 700        — Screen titles
Heading 1:      24px / 32px / Semibold 600    — Section titles
Heading 2:      20px / 28px / Semibold 600    — Card titles, dialog headers
Heading 3:      18px / 24px / Medium 500      — Sub-headings
Body Large:     16px / 24px / Regular 400     — Main text
Body Medium:    14px / 20px / Regular 400     — Secondary text
Body Small:     12px / 16px / Regular 400     — Captions, timestamps
Label:          14px / 20px / Medium 500      — Button text, tabs
Label Small:    12px / 16px / Medium 500      — Badges, tags
Overline:       10px / 14px / Bold 700 / UPPERCASE / LS: 1px — Category labels
Mono Data:      14px / 20px / JetBrains Mono 500 — Credits, AI %
```

### 3.3 Brand Impact Style (from rule.md)

```
Titles:     Inter Black (900) Italic, tracking: -0.05em
Usage:      "FLEXME", "FLEXSHOT", "VERIFIED", hero phrases
Effect:     Speed, energy, explosion — the brand signature
```

### 3.4 i18n Typography Rules

```
- CJK (JA, KO): increase line-height by ~10%
- Vietnamese: Inter supports diacritics natively
- RTL-ready: use logical properties (start/end)
- Tab labels: max 5 chars for all 6 languages
- Allow 40% text expansion for non-English buttons
```

---

## 4. ICONOGRAPHY (SVG only — NO emoji)

### 4.1 Icon Library

```
Primary:    Lucide Icons (lucide-react)
Style:      Outline (default), Filled (active/selected)
Sizes:      16px (inline), 20px (standard), 24px (nav), 32px (feature)
Stroke:     1.5px
Color:      inherit from parent
```

### 4.2 Core Feature Icons

| Feature | Icon | Color | Meaning |
|---------|------|-------|---------|
| FlexLocket | Camera | White/Silver | Instant, minimal capture |
| FlexShot | Flame / Zap | Gold #F59E0B (brand) | Trending, explosive |
| FlexTale | Layers / BookOpen | Purple #7C3AFF | Multi-layered stories |
| AI Enhance | Sparkles | Silver/White | AI magic |
| Verified | ShieldCheck | Gold #F59E0B (brand) | Trust, achievement |
| Alpha | Crown | Gold #F59E0B (brand) | VIP membership |

### 4.3 Navigation Icons

```
Bottom Tab (24px, outline → filled on active):
  Glow:     Sparkles
  Create:   Wand
  Story:    BookOpen
  Saved:    Grid
  Me:       User

Actions (20px):
  Back:       ChevronLeft (auto-flip RTL)
  Close:      X
  Share:      Share2
  Download:   Download
  Settings:   Settings
  Search:     Search
  Notify:     Bell
  Edit:       Pencil
  Delete:     Trash2
  Regenerate: RefreshCw

Status:
  Completed:   CheckCircle (green)
  Processing:  Loader (spin)
  Pending:     Clock
  Error:       AlertCircle (red)
  Credits:     Zap
```

### 4.4 Icon Rules (from rule.md)

```
- NEVER use emoji as functional icons
- Use SVG from Lucide (or Heroicons as fallback)
- Bottom bar icons: generous padding for thumb operation
- Touch target minimum: 44x44px
- cursor: pointer on ALL clickable elements
```

---

## 5. SPACING & LAYOUT

### 5.1 Spacing Scale (4px base)

```
space-0:    0px
space-1:    4px       (minimal)
space-2:    8px       (chip padding, small gap)
space-3:    12px      (small padding)
space-4:    16px    ★ (standard padding, gap)
space-5:    20px      (larger padding)
space-6:    24px    ★ (section margin)
space-8:    32px      (large spacing)
space-10:   40px      (section spacing)
space-12:   48px      (hero spacing)
space-16:   64px      (major blocks)
```

### 5.2 Screen Layout

```
Design width:     390px (iPhone 14/15)
Content width:    390 - 32 = 358px
Status bar:       44px (system)
App header:       56px
Content area:     scrollable, padding-x: 16px
Bottom tab:       56px + safe area (34px)
Safe area top:    59px (Dynamic Island) / 44px (notch)
Safe area bottom: 34px (home indicator)
```

### 5.3 Grid

```
Template gallery:  2 columns, gap 12px, margin 16px
Gallery (saved):   3 columns, gap 4px
Story pack list:   1 column, full width
Vibe selector:     horizontal scroll, gap 8px
Category chips:    horizontal scroll, gap 8px
```

---

## 6. BORDER RADIUS

```
radius-sm:    8px       (chip, badge, small button)
radius-md:    12px    ★ (card, input, large button)
radius-lg:    16px      (large card, modal)
radius-xl:    20px      (bottom sheet, featured card)
radius-2xl:   24px      (featured hero card)
radius-full:  9999px    (avatar, pill, tag)
```

---

## 7. SHADOWS & ELEVATION (Dark Mode)

```
shadow-sm:    0 1px 2px rgba(0,0,0,0.3)
shadow-md:    0 4px 6px rgba(0,0,0,0.4)     ★ (default card)
shadow-lg:    0 10px 15px rgba(0,0,0,0.5)    (elevated, dropdown)
shadow-xl:    0 20px 25px rgba(0,0,0,0.5)    (modal, sheet)
shadow-glow:  0 0 25px rgba(245,158,11,0.7)   (brand logo glow)
shadow-gold:  0 15px 30px rgba(245,158,11,0.3) (CTA button shadow)
shadow-vip:   0 50px 100px rgba(0,0,0,0.9)   (phone frame, modals)

Border substitute: 1px solid rgba(255,255,255,0.06)
```

---

## 8. COMPONENT SPECS

### 8.1 Primary Button (CTA)

```
Height:       52px
Padding:      0 24px
Radius:       12px
Background:   Gold #F59E0B solid (or Royal Flare gradient)
Text:         16px / Semibold / White
Width:        full (minus 16px margin each side)
Active:       scale(0.97) + opacity 0.9
Disabled:     opacity 0.4
Shadow:       shadow-md
Cursor:       pointer
```

### 8.2 Secondary Button

```
Height:       44px
Border:       1.5px solid Amber 500
Background:   transparent
Text:         14px / Medium / Amber 500
Radius:       12px
Active:       bg Amber 50
```

### 8.3 Icon Button

```
Size:         44x44px (minimum touch target)
Icon:         24px center
Radius:       full (circle) or 12px (rounded square)
Background:   bg-secondary or transparent
Active:       bg-tertiary
```

### 8.4 Template Card (FlexShot)

```
Width:        (screen - 32 - 12) / 2 = ~173px
Image ratio:  3:4
Radius:       12px
Image radius: 12px 12px 0 0
Padding btm:  12px
Title:        14px / Medium
Meta:         12px / Regular / text-secondary
Badge:        10px / Bold / bg Amber 600
Shadow:       shadow-md
Active:       scale(0.97)
```

### 8.5 Bottom Navigation

```
Height:       56px + safe area
Background:   bg-primary + backdrop-blur(20px)
Border top:   1px solid rgba(255,255,255,0.06)
Items:        4, equally spaced
Icon:         24px, outline → filled active
Label:        10px / Medium / max 5 chars
Active:       Amber 500 (icon + text) + 4px dot below
Inactive:     text-tertiary
Note:         "Saved" is merged into "Me" tab as a sub-tab

Tab Labels (max 5 chars):
  EN: Glow  / Create / Story / Me
  VI: Glow  / Tạo   / Story / Tôi
  ES: Glow  / Crear  / Story / Yo
  PT: Glow  / Criar  / Story / Eu
  JA: Glow  / 作成   / Story / 自分
  KO: Glow  / 만들기  / Story / 나
```

### 8.6 Bottom Sheet / Modal

```
Radius top:    24px
Handle:        36x4px, radius full, bg gray-400, margin-top 8px
Padding:       24px 16px
Background:    bg-primary
Overlay:       rgba(0,0,0,0.4) + blur(4px)
Animation:     slide up 300ms ease-out
Dismiss:       swipe down or tap overlay
```

### 8.7 Toast / Snackbar

```
Position:      bottom, above tab bar
Margin:        16px horizontal, 8px bottom
Padding:       12px 16px
Radius:        12px
Background:    bg-elevated + border-subtle
Text:          14px / Medium
Icon:          20px, start side
Duration:      3 seconds
Animation:     slide up + fade
```

---

## 9. ANIMATION & MOTION

### 9.1 Timing

```
instant:     100ms    (hover, press)
fast:        200ms    (tab switch, chip select)
normal:      300ms    (page transition, modal)
slow:        400ms    (bottom sheet, complex)
```

### 9.2 Easing

```
ease-out:     cubic-bezier(0.0, 0.0, 0.2, 1)     — entrance
ease-in:      cubic-bezier(0.4, 0.0, 1, 1)        — exit
ease-in-out:  cubic-bezier(0.4, 0.0, 0.2, 1)      — move
spring:       cubic-bezier(0.34, 1.56, 0.64, 1)   — bounce
```

### 9.3 Key Animations

```
Page push:        slide-in from end, 300ms ease-out
Page pop:         slide-out to end, 250ms ease-in
Bottom sheet:     slide-up 300ms ease-out + overlay fade
Button press:     scale(0.97) 100ms → scale(1) 200ms spring
Generation:       shimmer 1.5s linear infinite + progress bar
Image reveal:     blur(20px) → blur(0) 500ms ease-out
Vibe switch:      crossfade 200ms ease
Card share:       scale-up 300ms spring
Loading dots:     bounce 1s infinite staggered
```

---

## 10. ACCESSIBILITY

```
Min touch target:      44x44px
Min contrast:          4.5:1 (normal text), 3:1 (large text, icons)
Min font size:         12px
Dynamic type:          Scale 80%-200%
Haptic feedback:       On button press, slider, complete
VoiceOver/TalkBack:    Labels on all interactive elements (via i18n)
Reduce motion:         Respect prefers-reduced-motion
Direction:             RTL-ready (logical properties: start/end)
Focus states:          Visible ring for keyboard navigation
cursor: pointer:       ALL clickable/hoverable elements
```

---

## 11. PRE-DELIVERY CHECKLIST (from UI Pro Max)

```
[ ] No emojis as icons — use SVG (Lucide)
[ ] cursor: pointer on ALL clickable elements
[ ] Hover states with smooth transitions (150-300ms)
[ ] Text contrast minimum 4.5:1
[ ] Focus states visible for keyboard nav
[ ] prefers-reduced-motion respected
[ ] Touch targets minimum 44x44px
[ ] Responsive: 375px, 390px, 430px
[ ] Dark mode as default
[ ] Brand Royal Gold #F59E0B consistent
[ ] i18n tab labels max 5 chars
[ ] Brand names never translated
```

---

## 12. TAILWIND CONFIG

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A',
          300: '#FCD34D', 400: '#FBBF24', 500: '#F59E0B',
          600: '#D97706', 700: '#B45309', 800: '#92400E',
          900: '#78350F',
        },
        accent: { purple: '#7C3AFF', blue: '#3B82F6' },
        surface: {
          primary: '#050505',
          secondary: '#121212',
          tertiary: '#1A1A1A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans JP', 'Noto Sans KR', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '8px', md: '12px', lg: '16px',
        xl: '20px', '2xl': '24px',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
};
```
