import { useEffect, useState } from 'react';
import { useMerchantStore } from '@/lib/stores/merchant-store';
import { applyThemeColors, BrandingColors } from '@/lib/utils/theme-utils';

/**
 * Custom hook for managing theme application
 * @param initialBranding - Optional initial branding data to apply
 * @returns Object with theme state and functions
 */
export function useTheme(initialBranding?: BrandingColors) {
  const { selectedMerchant } = useMerchantStore();
  const [themeApplied, setThemeApplied] = useState(false);

  // Apply theme from selected merchant when it changes
  useEffect(() => {
    if (selectedMerchant?.branding && !themeApplied) {
      console.log('Applying theme from selected merchant:', selectedMerchant.name);
      console.log('Selected merchant branding:', JSON.stringify(selectedMerchant.branding, null, 2));
      applyThemeColors(selectedMerchant.branding);
      setThemeApplied(true);
    } else if (selectedMerchant && !selectedMerchant.branding) {
      console.warn('Selected merchant has no branding data:', selectedMerchant.name);
    }
  }, [selectedMerchant, themeApplied]);

  // Apply initial branding if provided
  useEffect(() => {
    if (initialBranding && !themeApplied && !selectedMerchant) {
      console.log('Applying theme from initial branding data');
      console.log('Initial branding data:', JSON.stringify(initialBranding, null, 2));
      applyThemeColors(initialBranding);
      setThemeApplied(true);
    }
  }, [initialBranding, themeApplied, selectedMerchant]);

  // Debug effect to log when the hook is initialized
  useEffect(() => {
    console.log('useTheme hook initialized', {
      hasSelectedMerchant: !!selectedMerchant,
      hasInitialBranding: !!initialBranding,
      themeApplied
    });

    return () => {
      console.log('useTheme hook cleanup');
    };
  }, []);

  // Function to manually update theme
  const updateTheme = (branding: BrandingColors) => {
    console.log('Manually updating theme with data:', JSON.stringify(branding, null, 2));
    applyThemeColors(branding);
    setThemeApplied(true);
  };

  // Function to reset theme application state
  const resetThemeState = () => {
    setThemeApplied(false);
  };

  return {
    themeApplied,
    updateTheme,
    resetThemeState
  };
}
