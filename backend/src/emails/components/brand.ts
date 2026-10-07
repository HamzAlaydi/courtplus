/**
 * Court+ brand tokens for email.
 *
 * Mirrors website/src/assets/styles (_variables): $color-primary #c0ff42,
 * $color-black #0a1517, $color-black-light #142326.
 *
 * Email clients strip <style> blocks and ignore CSS variables, so every colour
 * has to be inlined as a literal hex at the point of use — hence a plain
 * object rather than a theme.
 */
export const brand = {
  /** Signature lime. Used for the CTA and accent rules. */
  primary: '#c0ff42',
  primaryDark: '#98d61b',

  /** Deep near-black used across the app's surfaces. */
  black: '#0a1517',
  blackLight: '#142326',

  white: '#ffffff',
  /** Page backdrop behind the card. */
  canvas: '#eef1f0',

  text: '#171717',
  textMuted: '#5b6472',
  textOnDark: '#e8ece9',
  textOnDarkMuted: '#8c9a97',

  border: '#e3e8e6',

  appName: 'Court+',
  siteUrl: 'https://courtplusapp.com',
  supportEmail: 'support@courtplusapp.com',
} as const;

/**
 * Resolved at RENDER time, not at import time.
 *
 * As a module-level const this read `process.env` while the module graph was
 * still being evaluated — before ConfigModule had loaded .env — so
 * APP_LOGO_URL was always undefined and every email in the product silently
 * fell back to the placeholder wordmark, whatever the vendor configured.
 */
export const getLogoUrl = (): string =>
  process.env.APP_LOGO_URL || 'https://courtplusapp.com/logo512.png';
