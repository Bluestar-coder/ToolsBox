#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const COVERAGE_FILE = path.resolve('coverage/coverage-final.json');

const GROUP_RULES = [
  {
    name: 'encoder',
    prefixes: ['src/modules/encoder-decoder/'],
    thresholds: { statements: 40, functions: 50, branches: 25, lines: 42 },
  },
  {
    name: 'core',
    prefixes: ['src/core/'],
    thresholds: { statements: 60, functions: 50, branches: 38, lines: 62 },
  },
  {
    name: 'recipe',
    prefixes: ['src/modules/recipe-tool/'],
    thresholds: { statements: 50, functions: 50, branches: 55, lines: 52 },
  },
  {
    name: 'formatter',
    prefixes: ['src/modules/code-formatter/'],
    thresholds: { statements: 35, functions: 35, branches: 30, lines: 35 },
  },
  {
    name: 'http-debug',
    prefixes: ['src/modules/http-debug/'],
    thresholds: { statements: 60, functions: 50, branches: 48, lines: 64 },
  },
  {
    name: 'ip-network',
    prefixes: ['src/modules/ip-network/'],
    thresholds: { statements: 85, functions: 85, branches: 75, lines: 85 },
  },
  {
    name: 'qrcode',
    prefixes: ['src/modules/qrcode-tool/'],
    thresholds: { statements: 40, functions: 50, branches: 35, lines: 40 },
  },
  {
    name: 'regex',
    prefixes: ['src/modules/regex-tool/'],
    thresholds: { statements: 75, functions: 50, branches: 50, lines: 75 },
  },
  {
    name: 'diff',
    prefixes: ['src/modules/diff-tool/'],
    thresholds: { statements: 65, functions: 60, branches: 60, lines: 65 },
  },
  {
    name: 'crypto-core',
    prefixes: [
      'src/modules/crypto-tool/components/CryptoTool.tsx',
      'src/modules/crypto-tool/components/tabs/HashTab.tsx',
      'src/modules/crypto-tool/components/tabs/JWTTab.tsx',
      'src/modules/crypto-tool/components/tabs/X25519Tab.tsx',
      'src/modules/crypto-tool/utils/hash.ts',
      'src/modules/crypto-tool/utils/jwt.ts',
      'src/modules/crypto-tool/utils/asymmetric.ts',
      'src/modules/crypto-tool/utils/constants.ts',
    ],
    thresholds: { statements: 60, functions: 60, branches: 40, lines: 60 },
  },
  {
    name: 'time',
    prefixes: ['src/modules/time-tool/'],
    thresholds: { statements: 55, functions: 45, branches: 25, lines: 55 },
  },
];

function createMetric() {
  return {
    statements: { covered: 0, total: 0 },
    functions: { covered: 0, total: 0 },
    branches: { covered: 0, total: 0 },
    lines: { covered: 0, total: 0 },
  };
}

function percentage(covered, total) {
  if (total === 0) return 100;
  return (covered / total) * 100;
}

function collectFileMetric(fileCoverage, metric) {
  for (const hits of Object.values(fileCoverage.s ?? {})) {
    metric.statements.total += 1;
    if (hits > 0) metric.statements.covered += 1;
  }

  for (const hits of Object.values(fileCoverage.f ?? {})) {
    metric.functions.total += 1;
    if (hits > 0) metric.functions.covered += 1;
  }

  for (const branchHits of Object.values(fileCoverage.b ?? {})) {
    for (const hits of branchHits) {
      metric.branches.total += 1;
      if (hits > 0) metric.branches.covered += 1;
    }
  }

  const lineCoverage = new Map();
  for (const [statementId, statementMeta] of Object.entries(fileCoverage.statementMap ?? {})) {
    const line = statementMeta.start.line;
    const isCovered = (fileCoverage.s?.[statementId] ?? 0) > 0;
    lineCoverage.set(line, (lineCoverage.get(line) ?? false) || isCovered);
  }

  metric.lines.total += lineCoverage.size;
  metric.lines.covered += [...lineCoverage.values()].filter(Boolean).length;
}

if (!fs.existsSync(COVERAGE_FILE)) {
  console.error(`[coverage-gate] Missing coverage file: ${COVERAGE_FILE}`);
  console.error('[coverage-gate] Run `npm run test:coverage` first.');
  process.exit(1);
}

const rawCoverage = JSON.parse(fs.readFileSync(COVERAGE_FILE, 'utf8'));
let hasFailures = false;

console.log('[coverage-gate] Module thresholds');
console.log('--------------------------------------');

for (const group of GROUP_RULES) {
  const metric = createMetric();

  for (const [absolutePath, fileCoverage] of Object.entries(rawCoverage)) {
    const relativePath = path.relative(process.cwd(), absolutePath).replaceAll('\\', '/');
    if (group.prefixes.some(prefix => relativePath.startsWith(prefix))) {
      collectFileMetric(fileCoverage, metric);
    }
  }

  const summary = {
    statements: percentage(metric.statements.covered, metric.statements.total),
    functions: percentage(metric.functions.covered, metric.functions.total),
    branches: percentage(metric.branches.covered, metric.branches.total),
    lines: percentage(metric.lines.covered, metric.lines.total),
  };

  console.log(
    `${group.name.padEnd(12)} statements ${summary.statements.toFixed(2)}% | ` +
      `functions ${summary.functions.toFixed(2)}% | ` +
      `branches ${summary.branches.toFixed(2)}% | ` +
      `lines ${summary.lines.toFixed(2)}%`
  );

  for (const key of Object.keys(group.thresholds)) {
    const k = key;
    if (summary[k] < group.thresholds[k]) {
      hasFailures = true;
      console.error(
        `[coverage-gate] ${group.name}.${k} ${summary[k].toFixed(2)}% < ${group.thresholds[k]}%`
      );
    }
  }
}

console.log('--------------------------------------');

if (hasFailures) {
  process.exit(1);
}

console.log('[coverage-gate] Passed');
