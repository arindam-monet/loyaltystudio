/**
 * Utility functions for theme management
 */

/**
 * Calculate a contrasting text color (black or white) based on a background color
 * @param hexColor - Hex color code (with or without #)
 * @returns Contrasting color (#000000 or #ffffff)
 */
export const getContrastColor = (hexColor: string): string => {
  if (!hexColor) return '#ffffff';

  // Remove the # if it exists
  hexColor = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  // Check if parsing failed
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    console.warn('Failed to parse color:', hexColor);
    return '#ffffff';
  }

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for bright colors, white for dark colors
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

/**
 * Interface for branding colors
 */
export interface BrandingColors {
  primaryColor?: string;
  primaryTextColor?: string;
  secondaryColor?: string;
  secondaryTextColor?: string;
  accentColor?: string;
  accentTextColor?: string;
  [key: string]: any;
}

/**
 * Apply theme colors to CSS variables
 * @param branding - Branding colors object
 */
export const applyThemeColors = (branding: BrandingColors): void => {
  // Check if we're in a browser environment
  if (typeof document === 'undefined') {
    console.warn('applyThemeColors called in a non-browser environment');
    return;
  }
  if (!branding) {
    console.warn('No branding data provided to applyThemeColors');
    return;
  }

  console.log('Applying theme colors:', JSON.stringify(branding, null, 2));

  const root = document.documentElement;

  // Convert hex to HSL for better compatibility with the theme system
  const hexToHSL = (hex: string): string => {
    try {
      // Remove the # if it exists
      hex = hex.replace('#', '');

      // Convert hex to RGB
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;

      // Find the maximum and minimum values to calculate the lightness
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);

      // Calculate the lightness
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;

      // Only calculate the hue and saturation if the color isn't grayscale
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }

        h = Math.round(h * 60);
      }

      // Convert saturation and lightness to percentages
      s = Math.round(s * 100);
      const lightness = Math.round(l * 100);

      return `${h} ${s}% ${lightness}%`;
    } catch (error) {
      console.error('Error converting hex to HSL:', error, hex);
      return hex; // Return the original hex as fallback
    }
  };

  if (branding.primaryColor) {
    console.log(`Setting --primary to ${branding.primaryColor}`);
    try {
      const hslValue = hexToHSL(branding.primaryColor);
      root.style.setProperty('--primary', hslValue);
      console.log(`Set --primary to HSL: ${hslValue}`);
    } catch (e) {
      console.error('Failed to set primary color:', e);
      root.style.setProperty('--primary', branding.primaryColor);
    }

    const primaryForeground = branding.primaryTextColor || getContrastColor(branding.primaryColor);
    try {
      const hslValue = hexToHSL(primaryForeground);
      root.style.setProperty('--primary-foreground', hslValue);
      console.log(`Set --primary-foreground to HSL: ${hslValue}`);
    } catch (e) {
      console.error('Failed to set primary foreground color:', e);
      root.style.setProperty('--primary-foreground', primaryForeground);
    }
  }

  if (branding.secondaryColor) {
    console.log(`Setting --secondary to ${branding.secondaryColor}`);
    try {
      const hslValue = hexToHSL(branding.secondaryColor);
      root.style.setProperty('--secondary', hslValue);
      console.log(`Set --secondary to HSL: ${hslValue}`);
    } catch (e) {
      console.error('Failed to set secondary color:', e);
      root.style.setProperty('--secondary', branding.secondaryColor);
    }

    const secondaryForeground = branding.secondaryTextColor || getContrastColor(branding.secondaryColor);
    try {
      const hslValue = hexToHSL(secondaryForeground);
      root.style.setProperty('--secondary-foreground', hslValue);
      console.log(`Set --secondary-foreground to HSL: ${hslValue}`);
    } catch (e) {
      console.error('Failed to set secondary foreground color:', e);
      root.style.setProperty('--secondary-foreground', secondaryForeground);
    }
  }

  if (branding.accentColor) {
    console.log(`Setting --accent to ${branding.accentColor}`);
    try {
      const hslValue = hexToHSL(branding.accentColor);
      root.style.setProperty('--accent', hslValue);
      console.log(`Set --accent to HSL: ${hslValue}`);
    } catch (e) {
      console.error('Failed to set accent color:', e);
      root.style.setProperty('--accent', branding.accentColor);
    }

    const accentForeground = branding.accentTextColor || getContrastColor(branding.accentColor);
    try {
      const hslValue = hexToHSL(accentForeground);
      root.style.setProperty('--accent-foreground', hslValue);
      console.log(`Set --accent-foreground to HSL: ${hslValue}`);
    } catch (e) {
      console.error('Failed to set accent foreground color:', e);
      root.style.setProperty('--accent-foreground', accentForeground);
    }
  }

  // Also set success and warning colors
  root.style.setProperty('--success', '142.1 76.2% 36.3%');
  root.style.setProperty('--warning', '38 92% 50%');

  console.log('Theme colors applied successfully');
};
