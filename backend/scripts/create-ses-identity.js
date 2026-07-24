/* One-off helper: create a SES domain identity (console form was failing). */
const {
  SESv2Client,
  CreateEmailIdentityCommand,
  GetEmailIdentityCommand,
} = require('@aws-sdk/client-sesv2');

const client = new SESv2Client({
  region: 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function main() {
  const domain = process.argv[2] || 'courtplusapp.com';
  const res = await client.send(
    new CreateEmailIdentityCommand({
      EmailIdentity: domain,
      DkimSigningAttributes: undefined, // Easy DKIM default
    }),
  );
  console.log('IdentityType:', res.IdentityType);
  console.log('VerifiedForSendingStatus:', res.VerifiedForSendingStatus);
  const info = await client.send(
    new GetEmailIdentityCommand({ EmailIdentity: domain }),
  );
  console.log('VerificationStatus:', info.VerificationStatus);
  console.log('DKIM tokens (create one CNAME each: <token>._domainkey.' + domain + ' -> <token>.dkim.amazonses.com):');
  for (const t of info.DkimAttributes?.Tokens || []) console.log(' ', t);
}

main().catch((e) => {
  console.error('FAILED:', e.name, e.message);
  process.exit(1);
});
