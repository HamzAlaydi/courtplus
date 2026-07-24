/**
 * Pure date helpers with no dependencies on other utils modules.
 * Kept separate to avoid the helpers <-> constants import cycle.
 */
export const toUTCDate = (date: Date) => {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
  );
};
