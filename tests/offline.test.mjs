// Checks that the offline file list in sw.js includes every file the game
// needs. If this fails, add the missing file to FILES in sw.js.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;

function filesIn(folder, keep) {
  const found = [];
  for (const name of readdirSync(join(root, folder))) {
    const path = join(root, folder, name);
    if (statSync(path).isDirectory()) found.push(...filesIn(relative(root, path), keep));
    else if (keep(name)) found.push(relative(root, path));
  }
  return found;
}

test('sw.js lists every game file, so the game works offline', () => {
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  const listed = new Set([...sw.matchAll(/^\s*'([^']+)',$/gm)].map((match) => match[1]));
  const needed = [
    ...filesIn('src', (name) => /\.(js|css)$/.test(name)),
    ...filesIn('assets', (name) => /\.(woff2|png|jpg|webp|mp3|ogg|wav)$/.test(name)),
    'index.html',
    'manifest.webmanifest',
  ];
  const missing = needed.filter((file) => !listed.has(file));
  assert.deepEqual(missing, [], `Add these to FILES in sw.js: ${missing.join(', ')}`);
});

test('every file sw.js lists actually exists', () => {
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  const listed = [...sw.matchAll(/^\s*'([^']+)',$/gm)].map((match) => match[1]).filter((file) => file !== './');
  const gone = listed.filter((file) => {
    try {
      return !statSync(join(root, file)).isFile();
    } catch {
      return true;
    }
  });
  assert.deepEqual(gone, [], `These are in sw.js but don't exist (a typo, or a deleted file): ${gone.join(', ')}`);
});
