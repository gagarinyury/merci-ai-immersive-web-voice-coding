/**
 * Custom font configuration with Cyrillic support
 * Uses the Roboto font with full Russian character set
 */

import type { FontFamilies } from "@pmndrs/uikit/dist/text/font.js";

/**
 * Font families object for UIKit with Cyrillic-enabled Roboto
 * The URL points to our custom MSDF font JSON that includes Russian characters
 */
export const cyrillicFontFamilies: FontFamilies = {
  inter: {
    normal: "/fonts/Roboto-Regular.json",
  },
};

/**
 * Default font family name to use in UI
 */
export const DEFAULT_FONT_FAMILY = "inter";
