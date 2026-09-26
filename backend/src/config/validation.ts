import Joi from 'joi';

/**
 * Boot-time environment validation.
 *
 * Every variable read anywhere in the app must appear here. A variable that is
 * read but unvalidated fails at runtime — usually deep inside a payment or
 * notification path — instead of failing loudly at boot where it is cheap.
 */
export const validationSchema = Joi.object({
  // NOTE: 'dev' is deliberately NOT accepted. It used to be, and several code
  // paths branched on it to relax security (fixed OTP code, Stripe redirects).
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),

  TWILIO_ACCOUNT_SID: Joi.string().required(),
  TWILIO_AUTH_TOKEN: Joi.string().required(),
  TWILIO_VERIFY_SERVICE_SID: Joi.string().required(),

  AWS_REGION: Joi.string().required(),
  AWS_BUCKET: Joi.string().required(),
  FIREBASE_PRIVATE_KEY_ID: Joi.string().required(),
  FIREBASE_PRIVATE_KEY: Joi.string().required(),
  FIREBASE_PROJECT_ID: Joi.string().required(),
  FIREBASE_API_KEY: Joi.string().optional(),
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
  AWS_CDN_URL: Joi.string().uri().optional(),
  CLOUDFRONT_DISTRIBUTION_ID: Joi.string().optional(),
  SES_FROM_EMAIL: Joi.string().email().optional(),
  CONTACT_INBOX_EMAIL: Joi.string().email().optional(),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow(''),

  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USERNAME: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_SSL: Joi.boolean().default(false),
  DATABASE_POOL_SIZE: Joi.number().min(1).max(100).default(10),

  APP_LOGO_URL: Joi.string().required().uri(),
  APP_NAME: Joi.string().required(),
  FRONTEND_URL: Joi.string().uri().optional(),

  // Short secrets are brute-forceable; 32 chars is the practical floor for HS256.
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required()
    .invalid(Joi.ref('JWT_SECRET'))
    .messages({
      'any.invalid':
        'JWT_REFRESH_SECRET must differ from JWT_SECRET — sharing them lets a refresh token be replayed as an access token.',
    }),

  GOOGLE_MAPS_API_KEY: Joi.string().required(),

  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_PUBLIC_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
  // Each Stripe endpoint has its own signing secret. A missing one does not
  // fail open, but it does silently reject every event from that endpoint.
  STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET: Joi.string().required(),
  STRIPE_CONNECT_WEBHOOK_SECRET: Joi.string().required(),
  // Signing secret of the PLATFORM endpoint that delivers transfer.* to
  // /webhooks/payouts/stripe (Connect endpoint secret above covers account.updated).
  STRIPE_PAYOUTS_WEBHOOK_SECRET: Joi.string().optional(),
  STRIPE_BRANCH_PRODUCT_ID: Joi.string().required(),
  STRIPE_BRANCH_PRICE_ID: Joi.string().required(),
  // Both add-on prices are required: PricingService silently skips an item
  // whose price id is missing, so an unset court add-on left every extra court
  // flagged as billable, never invoiced, and stuck in pending_payment forever.
  // Country used when a vendor starts Stripe Connect onboarding without picking one.
  PAYOUTS_DEFAULT_COUNTRY: Joi.string().length(2).optional(),
  STRIPE_BRANCH_ADDON_PRICE_ID: Joi.string().required(),
  STRIPE_COURT_ADDON_PRICE_ID: Joi.string().required(),

  MAIL_DRIVER: Joi.string().valid('smtp', 'ses').default('ses'),
  SMTP_USER: Joi.string().when('MAIL_DRIVER', {
    is: 'smtp',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SMTP_PASS: Joi.string().when('MAIL_DRIVER', {
    is: 'smtp',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  COURT_PLUS_PERCENTAGE: Joi.number().min(0).max(1).default(0.2),

  // Comma-separated browser origins allowed to call the API. Mobile clients
  // send no Origin header and are unaffected.
  CORS_ORIGINS: Joi.string().optional().allow(''),

  // Serves Swagger at /reference/api. Off unless explicitly enabled.
  ENABLE_API_DOCS: Joi.boolean().default(false),

  // Local-only OTP bypass; must never be set in production.
  DEV_OTP_BYPASS_CODE: Joi.string()
    .optional()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.forbidden().messages({
        'any.unknown':
          'DEV_OTP_BYPASS_CODE must not be set when NODE_ENV=production — it is an authentication bypass for every account. For pre-launch phone testing use TEST_PHONE_OTP_CODE.',
      }),
    }),

  // Pre-launch testing on the real server (owner's decision): every phone
  // number signs in with this code and no SMS is sent, so testers need no
  // Twilio-verified number. Phone OTP only — staff/ops e-mail codes ignore it.
  // Allowed in production on purpose; remove it before real customers sign up.
  TEST_PHONE_OTP_CODE: Joi.string()
    .pattern(/^\d{6}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base':
        'TEST_PHONE_OTP_CODE must be 6 digits — the app only accepts 6-digit codes.',
    }),

  SENTRY_DSN: Joi.string().uri().optional().allow(''),
});
