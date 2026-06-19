// palettes.ts
// Curated colour palettes for SlideGenius, with automatic slide-role mapping.
// Each palette is 5 raw colours; getRoles() decides which is background / text /
// title / accent / secondary using luminance + saturation + a contrast safety check.
// This is the single source of truth: the picker UI, the preview, and the .pptx
// generator all read roles from the same function so they never drift apart.

export interface Palette {
  id: string;
  name: string;
  colors: [string, string, string, string, string];
}

export interface PaletteRoles {
  background: string; // slide background
  text: string;       // body text
  primary: string;    // titles / headers / accent bar
  accent: string;     // highlight stat / secondary emphasis
  secondary: string;  // sub-headers / muted accents
}

// ---- Curated set (garish / clashing community palettes removed) -------------

export const PALETTES: Palette[] = [
  { id: "deep-harbor",     name: "Deep Harbor",      colors: ["#e8ddcb", "#cdb380", "#036564", "#033649", "#031634"] },
  { id: "corporate-blue",  name: "Corporate Blue",   colors: ["#1b325f", "#9cc4e4", "#e9f2f9", "#3a89c9", "#f26c4f"] },
  { id: "slate-teal",      name: "Slate Teal",       colors: ["#2d2d29", "#215a6d", "#3ca2a2", "#92c7a3", "#dfece6"] },
  { id: "deep-forest",     name: "Deep Forest",      colors: ["#2a044a", "#0b2e59", "#0d6759", "#7ab317", "#a0c55f"] },
  { id: "twilight",        name: "Twilight",         colors: ["#f8b195", "#f67280", "#c06c84", "#6c5b7b", "#355c7d"] },
  { id: "cyan-depths",     name: "Cyan Depths",      colors: ["#343838", "#005f6b", "#008c9e", "#00b4cc", "#00dffc"] },
  { id: "crimson-steel",   name: "Crimson Steel",    colors: ["#000000", "#9f111b", "#b11623", "#292c37", "#cccccc"] },
  { id: "navy-coral",      name: "Navy Coral",       colors: ["#e8d5b7", "#0e2430", "#fc3a51", "#f5b349", "#e8d5b9"] },
  { id: "olive-slate",     name: "Olive Slate",      colors: ["#eee6ab", "#c5bc8e", "#696758", "#45484b", "#36393b"] },
  { id: "stone-sage",      name: "Stone & Sage",     colors: ["#d9ceb2", "#948c75", "#d5ded9", "#7a6a53", "#99b2b7"] },
  { id: "desert-linen",    name: "Desert Linen",     colors: ["#774f38", "#e08e79", "#f1d4af", "#ece5ce", "#c5e0dc"] },
  { id: "teal-mist",       name: "Teal Mist",        colors: ["#e3dfba", "#c8d6bf", "#93ccc6", "#6cbdb5", "#1a1f1e"] },
  { id: "sunset-teal",     name: "Sunset Teal",      colors: ["#fad089", "#ff9c5b", "#f5634a", "#ed303c", "#3b8183"] },
  { id: "coral-reef",      name: "Coral Reef",       colors: ["#99b898", "#fecea8", "#ff847c", "#e84a5f", "#2a363b"] },
  { id: "autumn-field",    name: "Autumn Field",     colors: ["#655643", "#80bca3", "#f6f7bd", "#e6ac27", "#bf4d28"] },
  { id: "plum-spice",      name: "Plum Spice",       colors: ["#351330", "#424254", "#64908a", "#e8caa4", "#cc2a41"] },
  { id: "lavender-field",  name: "Lavender Field",   colors: ["#5d4157", "#838689", "#a8caba", "#cad7b2", "#ebe3aa"] },
  { id: "harvest",         name: "Harvest",          colors: ["#8c2318", "#5e8c6a", "#88a65e", "#bfb35a", "#f2c45a"] },
  { id: "rose-quartz",     name: "Rose Quartz",      colors: ["#e94e77", "#d68189", "#c6a49a", "#c6e5d9", "#f4ead5"] },
  { id: "dusk-mauve",      name: "Dusk Mauve",       colors: ["#413e4a", "#73626e", "#b38184", "#f0b49e", "#f7e4be"] },
  { id: "spiced-cream",    name: "Spiced Cream",     colors: ["#5e412f", "#fcebb6", "#78c0a8", "#f07818", "#f0a830"] },
  { id: "berry-citrus",    name: "Berry Citrus",     colors: ["#452632", "#91204d", "#e4844a", "#e8bf56", "#e2f7ce"] },
  { id: "wheat-field",     name: "Wheat Field",      colors: ["#bbbb88", "#ccc68d", "#eedd99", "#eec290", "#eeaa88"] },
  { id: "olive-crimson",   name: "Olive Crimson",    colors: ["#67917a", "#170409", "#b8af03", "#ccbf82", "#e33258"] },
  { id: "soft-sand",       name: "Soft Sand",        colors: ["#aab3ab", "#c4cbb7", "#ebefc9", "#eee0b7", "#e8caaf"] },
  { id: "mauve-cream",     name: "Mauve Cream",      colors: ["#ab526b", "#bca297", "#c5ceae", "#f0e2a4", "#f4ebc3"] },
  { id: "moss-garden",     name: "Moss Garden",      colors: ["#607848", "#789048", "#c0d860", "#f0f0d8", "#604848"] },
  { id: "pastel-sunrise",  name: "Pastel Sunrise",   colors: ["#a8e6ce", "#dcedc2", "#ffd3b5", "#ffaaa6", "#ff8c94"] },
  { id: "midnight-meadow", name: "Midnight Meadow",  colors: ["#1c2130", "#028f76", "#b3e099", "#ffeaad", "#d14334"] },
  { id: "terracotta",      name: "Terracotta Slate", colors: ["#a7c5bd", "#e5ddcb", "#eb7b59", "#cf4647", "#524656"] },
  { id: "sage-clay",       name: "Sage Clay",        colors: ["#edebe6", "#d6e1c7", "#94c7b6", "#403b33", "#d3643b"] },
  { id: "golden-wheat",    name: "Golden Wheat",     colors: ["#fdf1cc", "#c6d6b8", "#987f69", "#e3ad40", "#fcd036"] },
  { id: "eucalyptus",      name: "Eucalyptus Coral", colors: ["#b9d3b0", "#81bda4", "#b28774", "#f88f79", "#f6aa93"] },
  { id: "caramel-sage",    name: "Caramel Sage",     colors: ["#5e3929", "#cd8c52", "#b7d1a3", "#dee8be", "#fcf7d3"] },
  { id: "burgundy-olive",  name: "Burgundy Olive",   colors: ["#951f2b", "#f5f4d7", "#e0dfb1", "#a5a36c", "#535233"] },
  { id: "seafoam-depths",  name: "Seafoam Depths",   colors: ["#eff3cd", "#b2d5ba", "#61ada0", "#248f8d", "#605063"] },
  { id: "sage-rust",       name: "Sage Rust",        colors: ["#73c8a9", "#dee1b6", "#e1b866", "#bd5532", "#373b44"] },
  { id: "steel-lime",      name: "Steel Lime",       colors: ["#4e4d4a", "#353432", "#94ba65", "#2790b0", "#2b4e72"] },
  { id: "tropical-lagoon", name: "Tropical Lagoon",  colors: ["#046d8b", "#309292", "#2fb8ac", "#93a42a", "#ecbe13"] },
  { id: "driftwood",       name: "Driftwood",        colors: ["#c1b398", "#605951", "#fbeec2", "#61a6ab", "#accec0"] },
  { id: "coastal-rose",    name: "Coastal Rose",     colors: ["#5e9fa3", "#dcd1b4", "#fab87f", "#f87e7b", "#b05574"] },
];

// ---- Colour maths ------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function saturation(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  if (mx === mn) return 0;
  const l = (mx + mn) / 2;
  return l > 0.5 ? (mx - mn) / (2 - mx - mn) : (mx - mn) / (mx + mn);
}

export function contrastRatio(a: string, b: string): number {
  const l1 = relLuminance(a);
  const l2 = relLuminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// ---- The mapping used everywhere --------------------------------------------

export function getRoles(palette: Palette): PaletteRoles {
  const sorted = [...palette.colors].sort((a, b) => relLuminance(a) - relLuminance(b));
  const text = sorted[0];        // darkest -> body text
  const background = sorted[4];  // lightest -> slide background

  const mids = [sorted[1], sorted[2], sorted[3]].sort((a, b) => saturation(b) - saturation(a));
  let primary = mids[0];
  const accent = mids[1];
  const secondary = mids[2];

  // Safety: if the title colour is too low-contrast on the background, pick the
  // remaining colour with the strongest contrast instead so titles stay legible.
  if (contrastRatio(primary, background) < 2.2) {
    const candidates = [text, ...mids].sort(
      (a, b) => contrastRatio(b, background) - contrastRatio(a, background)
    );
    primary = candidates[0];
  }

  return { background, text, primary, accent, secondary };
}

export function getPaletteById(id: string): Palette | undefined {
  return PALETTES.find((p) => p.id === id);
}

// Sensible fallback when the user skips palette selection.
export const DEFAULT_PALETTE_ID = "corporate-blue";
