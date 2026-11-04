import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { build } from 'esbuild';

const source = await readFile(new URL('../mobile/android.js', import.meta.url), 'utf8');
const { outputFiles } = await build({
  stdin: { contents: source, resolveDir: process.cwd() },
  bundle: true, write: false, format: 'iife',
  plugins: [{ name: 'native-mocks', setup(builder) {
    builder.onResolve({ filter: /^@capacitor\// }, args => ({ path: args.path, namespace: 'mocks' }));
    builder.onLoad({ filter: /.*/, namespace: 'mocks' }, () => ({ contents: `
      export const Capacitor = native.Capacitor;
      export const Filesystem = native.Filesystem;
      export const Directory = { Cache: 'CACHE' };
      export const Encoding = { UTF8: 'utf8' };
      export const Share = native.Share;
    ` }));
  } }],
});

function setup({ nativePlatform = true, writeError, shareError } = {}) {
  let listener;
  const calls = { files: [], shares: [], alerts: [] };
  const progress = { theme: 'dark', done: { lesson1: true }, notes: { lesson1: 'Revisar' } };
  const context = {
    native: {
      Capacitor: { isNativePlatform: () => nativePlatform },
      Filesystem: { writeFile: async file => { calls.files.push(file); if (writeError) throw writeError; return { uri: 'file:///cache/backup.json' }; } },
      Share: { share: async options => { calls.shares.push(options); if (shareError) throw shareError; } },
    },
    document: { addEventListener: (type, handler, capture) => { assert.equal(type, 'click'); assert.equal(capture, true); listener = handler; } },
    localStorage: { getItem: key => { assert.equal(key, 'banestes2026_plataforma_v1'); return JSON.stringify(progress); } },
    alert: message => calls.alerts.push(message),
  };
  vm.runInNewContext(outputFiles[0].text, context);
  const button = { disabled: false };
  const event = { target: { closest: selector => { assert.equal(selector, '[data-act="export"]'); return button; } }, preventDefault() { calls.prevented = true; }, stopImmediatePropagation() { calls.stopped = true; } };
  return { listener, event, button, calls, progress };
}

test('Android exports compatible JSON and shares the native file URI', async () => {
  const { listener, event, button, calls, progress } = setup();
  await listener(event);
  assert.equal(calls.prevented, true);
  assert.equal(calls.stopped, true);
  assert.equal(calls.files.length, 1);
  const backup = JSON.parse(calls.files[0].data);
  assert.equal(backup.app, 'banestes-2026');
  assert.equal(backup.version, 1);
  assert.deepEqual(backup.progress, progress);
  assert.equal(calls.files[0].directory, 'CACHE');
  assert.equal(calls.shares[0].files[0], 'file:///cache/backup.json');
  assert.equal(button.disabled, false);
  assert.deepEqual(calls.alerts, []);
});

test('browser keeps the original export handler', () => {
  assert.equal(setup({ nativePlatform: false }).listener, undefined);
});

test('file failure is reported and export button is enabled again', async () => {
  const { listener, event, button, calls } = setup({ writeError: new Error('Disk full') });
  await listener(event);
  assert.equal(calls.shares.length, 0);
  assert.match(calls.alerts[0], /Disk full/);
  assert.equal(button.disabled, false);
});

test('cancelling sharing does not show a failure alert', async () => {
  const { listener, event, calls } = setup({ shareError: new Error('Share canceled') });
  await listener(event);
  assert.deepEqual(calls.alerts, []);
});
