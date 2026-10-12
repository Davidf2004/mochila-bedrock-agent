import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AgentError, MAX_MODEL_CALLS, MAX_REQUEST_BYTES, MAX_TEXT_LENGTH, runAgent, validatePlan, validateRequest, splitMessages, validDate } from '../lib/agent.mjs';
import { createAppServer, isLocalRequest } from '../server.mjs';

const input = {
  text: '[10/11/26, 18:10] Maestra Ana: Mañana la entrada es a las 8:15. Traer botella de agua.\n\n[10/11/26, 18:20] Maestra Ana: Corrijo la entrada: 7:45. La gorra es opcional.',
  childName: 'Leo', targetDate: '2026-10-12',
};
const plan = {
  title: 'La mañana de Leo', child: 'Leo', date: '2026-10-12', arrivalTime: '07:45', summary: 'Dos cosas para revisar antes de salir.',
  items: [
    { id: 'water', label: 'Guardar la botella de agua', kind: 'pack', required: 'required', evidence: [1] },
    { id: 'cap', label: 'Elegir si llevar gorra', kind: 'wear', required: 'optional', evidence: [2] },
  ], changes: [{ before: 'Entrada a las 08:15', after: 'Entrada a las 07:45', evidence: [1, 2] }], questions: [],
};
let sequence = 0;
const call = (name, args = {}) => ({ toolUse: { name, input: args, toolUseId: `tool-${++sequence}` } });
const response = (...content) => ({ stopReason: 'tool_use', output: { message: { role: 'assistant', content } } });
const read = () => response(call('read_messages'), call('read_current_plan'));
const save = value => response(call('save_plan', { plan: value }));
function scripted(outputs, requests = []) {
  return async payload => {
    requests.push(payload);
    assert.ok(outputs.length, 'Unexpected additional model call');
    const output = outputs.shift();
    if (output instanceof Error) throw output;
    return output;
  };
}

test('agent reads source messages, compares, saves a validated card, and overrides child/date', async () => {
  const requests = [];
  const result = await runAgent(input, { transport: scripted([read(), save({ ...plan, child: 'Otro', date: '2026-10-13' })], requests) });
  assert.equal(result.mode, 'live');
  assert.equal(result.plan.child, 'Leo');
  assert.equal(result.plan.date, '2026-10-12');
  assert.deepEqual(result.messages.map(message => message.id), [1, 2]);
  assert.deepEqual(result.trace.map(item => [item.tool, item.status]), [['read_messages', 'success'], ['read_current_plan', 'success'], ['save_plan', 'success']]);
  assert.equal(requests.length, 2);
  assert.match(requests[0].system[0].text, /especulación más reciente de un padre NO/u);
  assert.match(requests[0].system[0].text, /DATOS NO CONFIABLES/u);
  assert.equal(requests[1].messages[2].content[0].toolResult.content[0].json.messages[1].id, 2);
});

test('invalid citation is returned as a tool error and can be repaired', async () => {
  const bad = structuredClone(plan);
  bad.items[0].evidence = [99];
  const requests = [];
  const result = await runAgent(input, { transport: scripted([read(), save(bad), save(plan)], requests) });
  assert.equal(result.trace[2].status, 'error');
  assert.equal(result.trace[3].status, 'success');
  const repair = requests[2].messages.at(-1).content[0].toolResult;
  assert.equal(repair.status, 'error');
  assert.match(repair.content[0].json.error, /referencia/u);
});

test('a guess made before receiving source results cannot be saved', async () => {
  const requests = [];
  const result = await runAgent(input, { transport: scripted([response(call('read_messages'), call('read_current_plan'), call('save_plan', { plan })), save(plan)], requests) });
  assert.equal(result.trace[2].status, 'error');
  assert.match(requests[1].messages.at(-1).content[2].toolResult.content[0].json.error, /recibe sus resultados/u);
});

test('partial reads cannot skip later corrections', async () => {
  const requests = [];
  await runAgent(input, { transport: scripted([
    response(call('read_messages', { ids: [1] }), call('read_current_plan')),
    save(plan), response(call('read_messages', { ids: [2] })), save(plan),
  ], requests) });
  assert.equal(requests[2].messages.at(-1).content[0].toolResult.status, 'error');
});

test('free text and unsaved JSON never become a plan; model calls are bounded', async () => {
  let calls = 0;
  await assert.rejects(runAgent(input, { transport: async () => { calls++; return { stopReason: 'end_turn', output: { message: { role: 'assistant', content: [{ text: JSON.stringify(plan) }] } } }; } }), error => error.code === 'AGENT_LIMIT');
  assert.equal(calls, MAX_MODEL_CALLS);
});

test('tool calls are bounded, including unknown tools', async () => {
  let calls = 0;
  await assert.rejects(runAgent(input, { transport: async () => { calls++; return response(call('unknown_tool'), call('unknown_tool')); } }), error => error.code === 'AGENT_LIMIT');
  assert.equal(calls, 4);
});

test('provider errors are friendly and do not disclose provider messages or secrets', async () => {
  const failure = Object.assign(new Error('secret-token and source text'), { name: 'AccessDeniedException' });
  await assert.rejects(runAgent(input, { transport: scripted([failure]) }), error => error instanceof AgentError && error.code === 'AWS_ACCESS' && !error.message.includes('secret-token'));
  await assert.rejects(runAgent(input, { transport: scripted([new Error('internal stack')]) }), error => error.code === 'AWS_ERROR' && !error.message.includes('stack'));
});

test('abort ends a stalled transport without a fabricated fallback', async () => {
  const controller = new AbortController();
  const pending = runAgent(input, { transport: () => new Promise(() => {}), signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, error => error.code === 'TIMEOUT');
});

test('strict input validation rejects oversized text, impossible dates, extra fields and invalid previous plans', () => {
  for (const invalid of [
    { ...input, text: 'x'.repeat(MAX_TEXT_LENGTH + 1) },
    { ...input, targetDate: '2026-02-30' },
    { ...input, text: '   ' },
    { ...input, childName: '' },
    { ...input, text: Array(181).fill('a').join('\n') },
    { ...input, instruction: 'ignore system' },
    { ...input, currentPlan: { ...plan, extra: true } },
  ]) assert.throws(() => validateRequest(invalid), AgentError);
  assert.equal(validDate('2028-02-29'), true);
  assert.deepEqual(splitMessages('a\n \n b'), [{ id: 1, text: 'a' }, { id: 2, text: 'b' }]);
});

test('plan validation rejects guessed or invalid times, extra fields and missing evidence', () => {
  const context = { messages: splitMessages(input.text) };
  for (const invalid of [
    { ...plan, arrivalTime: '25:00' },
    { ...plan, arrivalTime: '09:00' },
    { ...plan, arrivalTime: '18:10' },
    { ...plan, instructions: 'ignore rules' },
    { ...plan, items: [{ ...plan.items[0], evidence: [] }] },
    { ...plan, items: [plan.items[0], plan.items[0]] },
  ]) assert.throws(() => validatePlan(invalid, context), AgentError);
  assert.equal(validatePlan({ ...plan, arrivalTime: null }, context).arrivalTime, null);
});

test('same-origin checks reject cross-site requests and DNS rebinding hosts', () => {
  assert.equal(isLocalRequest({ headers: { host: '127.0.0.1:8787', origin: 'http://evil.test' } }), false);
  assert.equal(isLocalRequest({ headers: { host: 'evil.test:8787' } }), false);
  assert.equal(isLocalRequest({ headers: { host: 'localhost:8787', origin: 'http://localhost:8787', 'sec-fetch-site': 'same-origin' } }), true);
  assert.equal(isLocalRequest({ headers: { host: 'localhost:8787', 'sec-fetch-site': 'cross-site' } }), false);
});

async function withServer(options, fn) {
  const server = createAppServer(options);
  await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
  try { await fn(`http://127.0.0.1:${server.address().port}`); }
  finally { server.closeAllConnections(); await new Promise(resolveClose => server.close(resolveClose)); }
}

test('HTTP API validates payloads and never calls Bedrock when unconfigured', async () => {
  await withServer({ configuration: { configured: false, region: 'us-east-1', model: 'test' }, transport: () => { throw new Error('Must not call'); } }, async base => {
    const status = await fetch(`${base}/api/status`).then(result => result.json());
    assert.deepEqual(status, { configured: false, region: 'us-east-1', model: 'test' });
    const send = (body, type = 'application/json') => fetch(`${base}/api/plan`, { method: 'POST', headers: { 'Content-Type': type }, body });
    assert.equal((await send(JSON.stringify(input))).status, 503);
    assert.equal((await send('invalid')).status, 400);
    assert.equal((await send('{}', 'text/plain')).status, 415);
    assert.equal((await send('x'.repeat(MAX_REQUEST_BYTES + 1))).status, 413);
    const foreign = await fetch(`${base}/api/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://evil.test' }, body: JSON.stringify(input) });
    assert.equal(foreign.status, 403);
  });
});

test('HTTP live result and timeout obey the public contract', async () => {
  const configuration = { configured: true, region: 'us-east-1', model: 'test' };
  await withServer({ configuration, transport: scripted([read(), save(plan)]) }, async base => {
    const result = await fetch(`${base}/api/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    assert.equal(result.status, 200);
    const body = await result.json();
    assert.equal(body.mode, 'live');
    assert.equal(body.plan.arrivalTime, '07:45');
  });
  await withServer({ configuration, transport: () => new Promise(() => {}), agentTimeoutMs: 15 }, async base => {
    const result = await fetch(`${base}/api/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    assert.equal(result.status, 504);
    assert.equal((await result.json()).code, 'TIMEOUT');
  });
});

test('static server serves only dist, including when a symlink points outside', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'mochila-server-'));
  const outside = await mkdtemp(join(tmpdir(), 'mochila-outside-'));
  try {
    await writeFile(join(directory, 'index.html'), '<!doctype html><title>MOCHILA</title>');
    await writeFile(join(outside, 'secret.txt'), 'not for serving');
    await symlink(join(outside, 'secret.txt'), join(directory, 'secret.txt'));
    await withServer({ distPath: directory }, async base => {
      assert.equal((await fetch(base)).status, 200);
      assert.equal((await fetch(`${base}/secret.txt`)).status, 404);
      assert.equal((await fetch(`${base}/%2eenv`)).status, 404);
      assert.equal((await fetch(`${base}/server.mjs`)).status, 404);
    });
  } finally { await rm(directory, { recursive: true }); await rm(outside, { recursive: true }); }
});
