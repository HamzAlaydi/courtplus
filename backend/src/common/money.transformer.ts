import { ValueTransformer } from 'typeorm';

/**
 * Postgres returns `numeric` as a string to avoid the precision loss that
 * JavaScript numbers would introduce. Without a transformer every read would
 * hand the application a string, and `balance + amount` would silently
 * concatenate ("100" + 50 === "10050") instead of adding.
 *
 * Values are rounded to 2 decimal places on write so a computed fraction
 * (e.g. a commission split) can never be rejected by the numeric(14,2) column.
 */
export const moneyTransformer: ValueTransformer = {
  to: (value?: number | null): number | null =>
    value === null || value === undefined ? (value as null) : Math.round(value * 100) / 100,
  from: (value?: string | null): number | null =>
    value === null || value === undefined ? (value as null) : Number(value),
};
