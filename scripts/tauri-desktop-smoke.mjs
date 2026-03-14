#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const BASE_URL = process.env.TOOLSBOX_TAURI_DEV_URL || 'http://127.0.0.1:5173';
const SCREENSHOT_HELPER =
  process.env.TOOLSBOX_SCREENSHOT_HELPER ||
  path.join(os.homedir(), '.codex', 'skills', 'screenshot', 'scripts', 'take_screenshot.py');
const ANALYZER = path.resolve('scripts/analyze_png_whiteness.py');
const SKIP_START = process.env.TOOLSBOX_TAURI_SKIP_START === '1';
const APP_NAME = process.env.TOOLSBOX_TAURI_APP_NAME || 'ToolsBox';
const APP_ID = process.env.TOOLSBOX_TAURI_APP_ID || 'com.toolsbox.desktop';
const DEV_PORT = new URL(BASE_URL).port || '80';
const PROJECT_ROOT = process.cwd();
const ARTIFACT_DIR = process.env.TOOLSBOX_TAURI_ARTIFACT_DIR
  ? path.resolve(process.env.TOOLSBOX_TAURI_ARTIFACT_DIR)
  : null;

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: 'pipe',
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `${command} ${args.join(' ')} failed with exit code ${result.status}`,
        result.stdout,
        result.stderr,
      ]
        .filter(Boolean)
        .join('\n')
    );
  }

  return result.stdout.trim();
}

function maybeKillProcesses(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status !== 0) {
    return [];
  }

  return result.stdout
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function cleanupPortConflicts() {
  const pids = maybeKillProcesses('lsof', ['-tiTCP:' + DEV_PORT, '-sTCP:LISTEN']);
  for (const pid of pids) {
    spawnSync('kill', [pid], { stdio: 'ignore' });
  }
}

function ensureArtifactDir() {
  if (!ARTIFACT_DIR) {
    return null;
  }

  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  return ARTIFACT_DIR;
}

function writeArtifacts(screenshotPath, analysis, tauriLogs) {
  const artifactDir = ensureArtifactDir();
  if (!artifactDir) {
    return;
  }

  const screenshotName = path.basename(screenshotPath);
  fs.copyFileSync(screenshotPath, path.join(artifactDir, screenshotName));
  fs.writeFileSync(
    path.join(artifactDir, 'analysis.json'),
    JSON.stringify({ ...analysis, screenshot: screenshotName }, null, 2),
    'utf8'
  );
  fs.writeFileSync(path.join(artifactDir, 'tauri-dev.log'), tauriLogs, 'utf8');
}

function activateMacApp() {
  spawnSync('osascript', ['-e', `tell application id "${APP_ID}" to activate`], {
    stdio: 'ignore',
  });
}

function findTauriDesktopPid() {
  const result = spawnSync('ps', ['-axo', 'pid=,command='], {
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status !== 0) {
    throw new Error(`ps failed: ${result.stderr || result.stdout}`);
  }

  const candidates = result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+)\s+(.*)$/);
      return match ? { pid: Number(match[1]), command: match[2] } : null;
    })
    .filter(Boolean)
    .filter(({ command }) =>
      command.includes(`${PROJECT_ROOT}/src-tauri/target/debug/app`) ||
      command.includes(`${PROJECT_ROOT}/src-tauri/target/debug/bundle/macos/toolsbox.app/Contents/MacOS/app`) ||
      command.includes('target/debug/app') ||
      command.includes('toolsbox.app/Contents/MacOS/app')
    )
    .sort((a, b) => b.pid - a.pid);

  if (candidates.length === 0) {
    throw new Error('Unable to locate running Tauri desktop process');
  }

  return candidates[0].pid;
}

function activateMacAppByPid(pid) {
  const script = `tell application "System Events" to set frontmost of first application process whose unix id is ${pid} to true`;
  const result = spawnSync('osascript', ['-e', script], {
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `osascript activate failed for pid ${pid}`);
  }
}

function getFrontmostPid() {
  const result = spawnSync(
    'osascript',
    ['-e', 'tell application "System Events" to get unix id of first application process whose frontmost is true'],
    { encoding: 'utf8', stdio: 'pipe' }
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'Unable to query frontmost process');
  }

  return Number(result.stdout.trim());
}

async function waitForHttp(url, timeoutMs = 30_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Retry until timeout.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function main() {
  if (process.platform !== 'darwin') {
    throw new Error('tauri-desktop-smoke currently targets macOS desktop verification only');
  }

  let tauriProcess;
  let tauriLogs = '';

  if (!SKIP_START) {
    cleanupPortConflicts();

    tauriProcess = spawn(npmCmd, ['run', 'tauri', 'dev'], {
      stdio: 'pipe',
      env: process.env,
    });

    tauriProcess.stdout.on('data', (chunk) => {
      tauriLogs += chunk.toString('utf8');
    });
    tauriProcess.stderr.on('data', (chunk) => {
      tauriLogs += chunk.toString('utf8');
    });

    const stop = () => {
      if (tauriProcess && !tauriProcess.killed) {
        tauriProcess.kill('SIGTERM');
      }
    };

    process.on('exit', stop);
    process.on('SIGINT', () => {
      stop();
      process.exit(130);
    });
  }

  try {
    await waitForHttp(BASE_URL);
    await new Promise((resolve) => setTimeout(resolve, 8_000));
    const tauriPid = findTauriDesktopPid();
    activateMacApp();
    activateMacAppByPid(tauriPid);
    await new Promise((resolve) => setTimeout(resolve, 1_500));

    const frontmostPid = getFrontmostPid();
    if (frontmostPid !== tauriPid) {
      throw new Error(`Tauri app is not frontmost (expected pid ${tauriPid}, got ${frontmostPid})`);
    }

    const screenshotPath = runCommand('python3', [SCREENSHOT_HELPER, '--mode', 'temp', '--active-window']);
    const analysis = JSON.parse(runCommand('python3', [ANALYZER, screenshotPath]));
    writeArtifacts(screenshotPath, analysis, tauriLogs);

    if (analysis.blank_like) {
      throw new Error(
        [
          'Tauri desktop window appears blank.',
          `screenshot: ${analysis.path}`,
          `mean_luminance: ${analysis.mean_luminance}`,
          `stddev_luminance: ${analysis.stddev_luminance}`,
          `white_ratio: ${analysis.white_ratio}`,
          `tauri_pid: ${tauriPid}`,
          tauriLogs && 'tauri logs:',
          tauriLogs,
        ]
          .filter(Boolean)
          .join('\n')
      );
    }

    console.log(`Tauri desktop smoke passed: ${analysis.path}`);
    console.log(JSON.stringify(analysis, null, 2));
  } finally {
    if (tauriProcess && !tauriProcess.killed) {
      tauriProcess.kill('SIGTERM');
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
