// Maps backend error codes (backend/src/modules/shared/error-codes.ts) to
// localized messages under the `errors.*` locale block. Codes not in this
// list fall back to a friendly generic message — never shown raw to users.

const COVERED_CODES = new Set([
  // Auth & account
  "INVALID_CREDENTIALS",
  "INVALID_PASSWORD",
  "INCORRECT_CURRENT_PASSWORD",
  "NEW_PASSWORD_SAME_AS_CURRENT",
  "EMAIL_MUST_BE_DIFFERENT",
  "NO_PENDING_EMAIL_CHANGE",
  "INVALID_CODE",
  "CODE_EXPIRED",
  "INVALID_TOKEN",
  "INVALID_REFRESH_TOKEN",
  "REFRESH_TOKEN_REQUIRED",
  "SESSION_NOT_FOUND",
  "EMAIL_ALREADY_EXISTS",
  "EMAIL_NOT_FOUND",
  "ACCOUNT_ALREADY_EXISTS",
  "ACCOUNT_DELETED",
  "TOO_MANY_REQUESTS",
  "FORBIDDEN",
  "NOT_ALLOWED",
  // Phone
  "INVALID_PHONE_NUMBER",
  "PHONE_NUMBER_ALREADY_EXISTS",
  "PHONE_NUMBER_ALREADY_VERIFIED",
  "PHONE_NUMBER_NOT_VERIFIED",
  "PHONE_NUMBER_MUST_BE_DIFFERENT",
  // Staff & invitations
  "STAFF_NOT_FOUND",
  "STAFF_EMAIL_ALREADY_EXISTS",
  "INVALID_INVITATION",
  "INVITATION_NOT_FOUND_OR_USED",
  "CANNOT_INVITE_SELF",
  "CANNOT_INVITE_OWNER",
  "CANNOT_MODIFY_OWNER_ROLE",
  "CANNOT_ASSIGN_OWNER_TO_BRANCH",
  "CANNOT_ASSIGN_SELF",
  "ROLE_REQUIRED",
  "OWNER_CANNOT_DELETE_ACCOUNT",
  "CANNOT_MODIFY_LAST_SUPER_ADMIN",
  // Tenant, branches & courts
  "TENANT_NOT_FOUND",
  "TENANT_ALREADY_BLOCKED",
  "TENANT_NOT_BLOCKED",
  "UNSUSPEND_REQUEST_ALREADY_EXISTS",
  "BRANCH_NOT_FOUND",
  "BRANCH_CREATION_NOT_ALLOWED",
  "INVALID_BRANCH_STATUS_TRANSITION",
  "COURT_NOT_FOUND",
  "COURT_CREATION_NOT_ALLOWED",
  "INVALID_COURT_STATUS_TRANSITION",
  "LOCATION_NOT_FOUND",
  "SCHEDULE_NOT_FOUND",
  "OVERLAPPING_AVAILABILITIES",
  "INVALID_TIME_FORMAT",
  "RESOURCE_NOT_FOUND",
  // Assets
  "ASSET_NOT_FOUND",
  "ASSET_NOT_OWNED",
  "EXPLICIT_CONTENT_DETECTED",
  "MIMETYPE_REQUIRED",
  // Subscriptions & billing
  "SUBSCRIPTION_NOT_FOUND",
  "SUBSCRIPTION_ALREADY_EXISTS",
  "SUBSCRIPTION_REQUIRED",
  "INVALID_SUBSCRIPTION_STATE",
  "PAYMENT_METHOD_REQUIRED",
  "INSUFFICIENT_BALANCE",
  "PAYOUT_ACCOUNT_NOT_CONFIGURED",
  "AMOUNT_BELOW_MINIMUM",
  "PENDING_PAYOUT_EXISTS",
  "PAYOUT_NOT_FOUND",
  "PAYOUT_CREATION_FAILED",
  "CURRENCY_MISMATCH",
  "PAYOUT_NOT_PENDING",
  "PAYOUT_COUNTRY_NOT_SUPPORTED",
  "PAYOUT_PROVIDER_ERROR",
  "PAYOUT_NOT_PROCESSING",
  "PAYOUT_PROVIDER_UNSUPPORTED",
  "PARTICIPANT_ALREADY_PAID",
  "BLOCKED_BY_VENUE",
  // Bookings & reviews
  "BOOKING_NOT_FOUND",
  "SLOT_NOT_AVAILABLE",
  "SLOT_ALREADY_RESERVED",
  "INVALID_DATE",
  "REVIEW_ALREADY_EXISTS",
]);

const CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/;

/**
 * Resolve an API error to a friendly, localized message.
 * - Known SNAKE_CASE code → its `errors.*` translation
 * - Unknown SNAKE_CASE code → fallback (never the raw code)
 * - Readable string in `code` (backend-curated, e.g. validation messages) → as-is
 * - Anything else (incl. English-only 500s) → fallback
 */
export const getErrorMessage = (t, err, fallbackKey = "errors.generic") => {
  const data = err?.response?.data;
  const code = data?.code;

  if (typeof code === "string" && code) {
    if (CODE_PATTERN.test(code)) {
      return COVERED_CODES.has(code) ? t(`errors.${code}`) : t(fallbackKey);
    }
    return code; // readable backend message, e.g. "phoneNumber must be a valid phone number"
  }

  const message = data?.message;
  const status = err?.response?.status;
  // Pass through readable 4xx messages, but never English-only 500 text
  if (
    typeof message === "string" &&
    message &&
    !CODE_PATTERN.test(message) &&
    status &&
    status < 500
  ) {
    return message;
  }

  return t(fallbackKey);
};

/** Notify an API error with a friendly localized message. */
export const notifyError = (notify, err, t, fallbackKey) =>
  notify("error", getErrorMessage(t, err, fallbackKey));
