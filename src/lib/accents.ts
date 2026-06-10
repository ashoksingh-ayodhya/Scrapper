export type Accent = 'plasma' | 'solar' | 'acid' | 'magenta' | 'violet' | 'gold';

// Exact hex conversions of the tailwind.config.ts HSL palette, for Three.js materials.
export const ACCENT_HEX: Record<Accent, string> = {
  plasma: '#33ebff',
  solar: '#ff7e29',
  acid: '#2bee6c',
  magenta: '#fa42bd',
  violet: '#ad64f7',
  gold: '#fac038',
};

// Static class maps: dynamic strings like `text-${accent}` are invisible to the
// Tailwind JIT scanner and would be purged. Every class below exists literally.
export const ACCENT_TEXT: Record<Accent, string> = {
  plasma: 'text-plasma',
  solar: 'text-solar',
  acid: 'text-acid',
  magenta: 'text-magenta',
  violet: 'text-violet',
  gold: 'text-gold',
};

export const ACCENT_BG_FAINT: Record<Accent, string> = {
  plasma: 'bg-plasma/10',
  solar: 'bg-solar/10',
  acid: 'bg-acid/10',
  magenta: 'bg-magenta/10',
  violet: 'bg-violet/10',
  gold: 'bg-gold/10',
};

export const ACCENT_BG_HOVER: Record<Accent, string> = {
  plasma: 'hover:bg-plasma/20',
  solar: 'hover:bg-solar/20',
  acid: 'hover:bg-acid/20',
  magenta: 'hover:bg-magenta/20',
  violet: 'hover:bg-violet/20',
  gold: 'hover:bg-gold/20',
};

export const ACCENT_BORDER: Record<Accent, string> = {
  plasma: 'border-plasma/40',
  solar: 'border-solar/40',
  acid: 'border-acid/40',
  magenta: 'border-magenta/40',
  violet: 'border-violet/40',
  gold: 'border-gold/40',
};

// Glow halo for "this is live + interactive" framing around scene/glass cards.
export const ACCENT_GLOW: Record<Accent, string> = {
  plasma: 'shadow-[0_0_140px_-40px_rgba(51,235,255,0.65)]',
  solar: 'shadow-[0_0_140px_-40px_rgba(255,126,41,0.65)]',
  acid: 'shadow-[0_0_140px_-40px_rgba(43,238,108,0.65)]',
  magenta: 'shadow-[0_0_140px_-40px_rgba(250,66,189,0.65)]',
  violet: 'shadow-[0_0_140px_-40px_rgba(173,100,247,0.65)]',
  gold: 'shadow-[0_0_140px_-40px_rgba(250,192,56,0.65)]',
};

// Ring outline used to frame the live-simulation canvases / glass cards.
export const ACCENT_RING: Record<Accent, string> = {
  plasma: 'ring-1 ring-plasma/35',
  solar: 'ring-1 ring-solar/35',
  acid: 'ring-1 ring-acid/35',
  magenta: 'ring-1 ring-magenta/35',
  violet: 'ring-1 ring-violet/35',
  gold: 'ring-1 ring-gold/35',
};
