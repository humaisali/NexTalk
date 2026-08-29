const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = 'test-secret-that-is-long-enough-for-unit-tests';

const runMiddleware = async ({ tokenVersion, storedVersion }) => {
  const originalFindById = User.findById;
  process.env.JWT_SECRET = JWT_SECRET;
  User.findById = () => ({
    select: async () => ({ _id: 'user-1', tokenVersion: storedVersion })
  });

  const payload = { id: 'user-1' };
  if (tokenVersion !== undefined) payload.tokenVersion = tokenVersion;
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1m' });

  let result;
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = {
    status(code) {
      result = { code };
      return this;
    },
    json(body) {
      result.body = body;
      return this;
    }
  };

  try {
    await authMiddleware(req, res, () => { result = { code: 200, user: req.user }; });
    return result;
  } finally {
    User.findById = originalFindById;
  }
};

test('accepts a token with the current session version', async () => {
  const result = await runMiddleware({ tokenVersion: 3, storedVersion: 3 });
  assert.equal(result.code, 200);
});

test('rejects a token after its session version is revoked', async () => {
  const result = await runMiddleware({ tokenVersion: 2, storedVersion: 3 });
  assert.equal(result.code, 401);
  assert.match(result.body.message, /revoked/i);
});

test('accepts legacy version-zero tokens during migration', async () => {
  const result = await runMiddleware({ tokenVersion: undefined, storedVersion: 0 });
  assert.equal(result.code, 200);
});
