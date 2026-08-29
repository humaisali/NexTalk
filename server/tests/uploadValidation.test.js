const test = require('node:test');
const assert = require('node:assert/strict');
const uploadRouter = require('../routes/upload');

const { ALLOWED_MIME_TYPES, hasValidSignature } = uploadRouter._test;

test('rejects active web content MIME types', () => {
  assert.equal(ALLOWED_MIME_TYPES.has('text/html'), false);
  assert.equal(ALLOWED_MIME_TYPES.has('image/svg+xml'), false);
  assert.equal(ALLOWED_MIME_TYPES.has('application/javascript'), false);
});

test('accepts matching image signatures and rejects spoofed images', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
  const html = Buffer.from('<script>alert(1)</script>');
  assert.equal(hasValidSignature(png, 'image/png'), true);
  assert.equal(hasValidSignature(html, 'image/png'), false);
});

test('validates common document and audio containers', () => {
  assert.equal(hasValidSignature(Buffer.from('%PDF-1.7'), 'application/pdf'), true);
  assert.equal(hasValidSignature(Buffer.from([0x50, 0x4b, 0x03, 0x04]), 'application/zip'), true);
  assert.equal(hasValidSignature(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), 'audio/webm'), true);
});
