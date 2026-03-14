#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const TAURI_CONFIG_FILE = path.resolve('src-tauri/tauri.conf.json');

function fail(message) {
  console.error(`[tauri-security] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(TAURI_CONFIG_FILE)) {
  fail(`Missing Tauri config: ${TAURI_CONFIG_FILE}`);
}

let config;
try {
  const raw = fs.readFileSync(TAURI_CONFIG_FILE, 'utf8');
  config = JSON.parse(raw);
} catch (error) {
  fail(`Failed to parse ${TAURI_CONFIG_FILE}: ${error instanceof Error ? error.message : String(error)}`);
}

const csp = config?.app?.security?.csp;

if (typeof csp !== 'string' || !csp.trim()) {
  fail('`app.security.csp` must be a non-empty string (null/empty is not allowed).');
}

if (csp.trim().toLowerCase() === 'null') {
  fail('`app.security.csp` cannot be the string "null".');
}

const directives = new Map();
for (const chunk of csp.split(';')) {
  const line = chunk.trim();
  if (!line) continue;
  const [name, ...sources] = line.split(/\s+/);
  directives.set(name, sources);
}

function ensureDirective(name, requiredSources) {
  const sources = directives.get(name);
  if (!sources) {
    fail(`Missing CSP directive: ${name}`);
  }

  for (const source of requiredSources) {
    if (!sources.includes(source)) {
      fail(`CSP directive ${name} must include source: ${source}`);
    }
  }
}

ensureDirective('default-src', ["'self'"]);
ensureDirective('script-src', ["'self'"]);
ensureDirective('base-uri', ["'self'"]);
ensureDirective('form-action', ["'self'"]);
ensureDirective('object-src', ["'none'"]);

const connectSources = directives.get('connect-src');
if (!connectSources) {
  fail('Missing CSP directive: connect-src');
}

for (const source of ['http:', 'https:', 'ws:', 'wss:']) {
  if (!connectSources.includes(source)) {
    fail(`connect-src must include ${source} for HTTP Debug business flow`);
  }
}

const scriptSources = directives.get('script-src') ?? [];
if (scriptSources.includes('*')) {
  fail('script-src cannot contain wildcard `*`.');
}

console.log('[tauri-security] CSP baseline checks passed');
