const test = require('node:test');
const assert = require('node:assert/strict');

process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.GROQ_API_KEY = 'test-groq-key';
process.env.GEMINI_MODEL = 'gemini-3.6-flash';
process.env.GROQ_MODEL = 'qwen/qwen3.6-27b';

const ai = require('../services/geminiService');
const router = ai._test;

test.beforeEach(() => router.reset());

test('sends Groq requests in JSON mode with the configured model', async () => {
  const originalFetch = global.fetch;
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      headers: { get: () => null },
      json: async () => ({ choices: [{ message: { content: '{"ok":true}' } }] })
    };
  };

  try {
    const text = await router.callGroq('Return JSON.');
    const body = JSON.parse(request.options.body);
    assert.equal(text, '{"ok":true}');
    assert.equal(request.url, 'https://api.groq.com/openai/v1/chat/completions');
    assert.equal(body.model, 'qwen/qwen3.6-27b');
    assert.deepEqual(body.response_format, { type: 'json_object' });
    assert.equal(body.reasoning_effort, 'none');
  } finally {
    global.fetch = originalFetch;
  }
});

test('balances normal traffic between Gemini and Groq', async () => {
  const calls = [];
  router.setProviderOverride('gemini', async () => { calls.push('gemini'); return '{"provider":"gemini"}'; });
  router.setProviderOverride('groq', async () => { calls.push('groq'); return '{"provider":"groq"}'; });

  await router.callAI('one');
  await router.callAI('two');
  await router.callAI('three');
  await router.callAI('four');

  assert.deepEqual(calls, ['gemini', 'groq', 'gemini', 'groq']);
});

test('falls back after a rate limit and keeps the provider on cooldown', async () => {
  const calls = [];
  router.setProviderOverride('gemini', async () => {
    calls.push('gemini');
    const error = new Error('quota exceeded');
    error.status = 429;
    throw error;
  });
  router.setProviderOverride('groq', async () => { calls.push('groq'); return '{"provider":"groq"}'; });

  assert.equal(await router.callAI('one'), '{"provider":"groq"}');
  await router.callAI('two');
  await router.callAI('three');

  assert.deepEqual(calls, ['gemini', 'groq', 'groq', 'groq']);
  assert.equal(ai.getProviderStatus().providers.gemini.status, 'cooldown');
});
