// QA helper: mint JWTs for security testing. Usage:
//   node -r dotenv/config scripts/qa-mint-token.js <sub> <type> [role] [tenantId] [expOffsetSec]
const c = require('crypto');
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const [sub, type, role, tenantId, expOffset] = process.argv.slice(2);
const now = Math.floor(Date.now() / 1000);
const body = {
  sub,
  id: sub,
  type: type || 'customer',
  sid: 'qa-sess-1',
  deviceId: 'qa-dev-1',
  iat: now,
  exp: now + Number(expOffset || 1800),
};
if (role) body.role = role;
if (tenantId && tenantId !== 'null') body.tenantId = tenantId;
const u = b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64(body);
console.log(
  u + '.' + c.createHmac('sha256', process.env.JWT_SECRET).update(u).digest('base64url'),
);
