export default async function getConfig() {
  const env = process.env;

  return {
    port: parseInt(env.PORT, 10) || 3000,
    env: process.env.NODE_ENV,
    redis: {
      host: env.REDIS_HOST,
      port: parseInt(env.REDIS_PORT, 10) || 6379,
      password: env.REDIS_PASSWORD,
    },
    database: {
      host: env.DATABASE_HOST,
      port: parseInt(env.DATABASE_PORT, 10) || 5432,
      username: env.DATABASE_USERNAME,
      password: env.DATABASE_PASSWORD,
      name: env.DATABASE_NAME,
    },
    firebase: {
      apiKey: env.FIREBASE_API_KEY,
      projectId: env.FIREBASE_PROJECT_ID,
      privateKeyId: env.FIREBASE_PRIVATE_KEY_ID,
      privateKey: env.FIREBASE_PRIVATE_KEY,
    },
    twilio: {
      accountSid: env.TWILIO_ACCOUNT_SID,
      authToken: env.TWILIO_AUTH_TOKEN,
      serviceSid: env.TWILIO_VERIFY_SERVICE_SID,
    },
    aws: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION,
      bucketName: env.AWS_BUCKET,
      cdnUrl: env.AWS_CDN_URL,
      cloudfrontDistributionId: env.CLOUDFRONT_DISTRIBUTION_ID,
      sesFromEmail: env.SES_FROM_EMAIL || 'no-reply@mail.courtplusapp.com',
      contactInboxEmail:
        env.CONTACT_INBOX_EMAIL ||
        env.SES_FROM_EMAIL ||
        'no-reply@mail.courtplusapp.com',
    },
    google: {
      mapsApiKey: env.GOOGLE_MAPS_API_KEY,
    },
    jwt: {
      secret: env.JWT_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
    },
    auth: {
      // Local development convenience only. Validation rejects this whenever
      // NODE_ENV=production, and TwilioService refuses to boot if it slips through.
      devOtpBypassCode: env.DEV_OTP_BYPASS_CODE,
      // Pre-launch testing: fixed phone OTP, allowed in production. Phone
      // codes only — VerificationService never reads it for e-mail codes.
      testPhoneOtpCode: env.TEST_PHONE_OTP_CODE,
    },
    platform: {
      // Commission Court+ retains from each booking, expressed as a fraction.
      // This is the single source of truth — see payouts/constants.
      commissionRate: Number(env.COURT_PLUS_PERCENTAGE ?? 0.2),
    },
    payouts: {
      defaultCountry: env.PAYOUTS_DEFAULT_COUNTRY || 'SA',
    },
    stripe: {
      secretKey: env.STRIPE_SECRET_KEY,
      publicKey: env.STRIPE_PUBLIC_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
      subscriptionsWebhookSecret: env.STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET,
      branchProductId: env.STRIPE_BRANCH_PRODUCT_ID,
      branchPriceId: env.STRIPE_BRANCH_PRICE_ID,
      branchAddonPriceId: env.STRIPE_BRANCH_ADDON_PRICE_ID,
      courtAddonPriceId: env.STRIPE_COURT_ADDON_PRICE_ID,
    },
    mail: {
      driver: env.MAIL_DRIVER || 'ses',
      smtpUser: env.SMTP_USER,
      smtpPass: env.SMTP_PASS,
    },
    app: {
      name: env.APP_NAME,
      logo: env.APP_LOGO_URL,
      frontendUrl: env.FRONTEND_URL,
    },
  };
}

export type Config = Awaited<ReturnType<typeof getConfig>>;
