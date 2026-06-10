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
