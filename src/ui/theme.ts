/**
 * SpectraBeam - Playful Geometric Design System Tokens
 * 
 * "Stable Grid, Wild Decoration"
 * Friendly, Tactile, Pop, Energetic.
 */

export const PlayfulTheme = {
  colors: {
    paper: '#FFFDF5',        // Warm Cream / Off-White (Paper feel)
    ink: '#1E293B',          // Slate 800 (Softer than black)
    muted: '#F1F5F9',        // Slate 100
    mutedForeground: '#64748B', // Slate 500
    accent: '#8B5CF6',       // Vivid Violet (Primary Brand)
    accentForeground: '#FFFFFF',
    secondary: '#F472B6',    // Hot Pink (Playful pop)
    tertiary: '#FBBF24',     // Amber / Yellow (Optimism)
    quaternary: '#34D399',   // Emerald / Mint (Freshness)
    border: '#1E293B',       // Chunky 2px dark border
    borderSoft: '#E2E8F0',   // Slate 200
    card: '#FFFFFF',
  },
  fonts: {
    heading: "'Outfit', system-ui, sans-serif",
    body: "'Plus Jakarta Sans', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  shadows: {
    popSm: '2px 2px 0px 0px #1E293B',
    pop: '4px 4px 0px 0px #1E293B',
    popLg: '6px 6px 0px 0px #1E293B',
    popXl: '8px 8px 0px 0px #1E293B',
    popPink: '6px 6px 0px 0px #F472B6',
    popYellow: '6px 6px 0px 0px #FBBF24',
    popMint: '6px 6px 0px 0px #34D399',
  },
  radii: {
    sm: '8px',
    md: '16px',
    lg: '24px',
    full: '9999px',
  },
  borderWidth: '2px',
};

export class ThemeManager {
  private static STORAGE_KEY = 'spectrabeam_theme';

  public static init(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;
    this.applyTheme(isDark);
  }

  public static isDark(): boolean {
    return document.documentElement.classList.contains('dark');
  }

  public static toggle(): boolean {
    const willBeDark = !this.isDark();
    this.applyTheme(willBeDark);
    localStorage.setItem(this.STORAGE_KEY, willBeDark ? 'dark' : 'light');
    return willBeDark;
  }

  public static applyTheme(isDark: boolean): void {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
