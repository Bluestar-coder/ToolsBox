#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';

const BASE_URL = process.env.TOOLSBOX_E2E_BASE_URL || 'http://127.0.0.1:5173';
const SKIP_SERVER = process.env.TOOLSBOX_E2E_SKIP_SERVER === '1';
const session = `toolsbox-smoke-${Date.now()}`;

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

function runPlaywrightCli(args) {
  return runCommand('npx', [
    '--yes',
    '--package',
    '@playwright/cli',
    'playwright-cli',
    '--session',
    session,
    ...args,
  ]);
}

async function waitForServer(url, timeoutMs = 30_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until the dev server is ready.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for dev server at ${url}`);
}

async function main() {
  runCommand('npx', ['--version']);
  let shutdown = () => {};
  let exitPromise = new Promise(() => {});

  if (!SKIP_SERVER) {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const devLogs = [];

    const devServer = spawn(npmCmd, ['run', 'dev', '--', '--host', '127.0.0.1', '--strictPort'], {
      stdio: 'pipe',
      env: process.env,
    });

    devServer.stdout.on('data', (chunk) => {
      devLogs.push(chunk.toString('utf8'));
    });
    devServer.stderr.on('data', (chunk) => {
      devLogs.push(chunk.toString('utf8'));
    });

    shutdown = () => {
      if (!devServer.killed) {
        devServer.kill('SIGTERM');
      }
    };

    process.on('exit', shutdown);
    process.on('SIGINT', () => {
      shutdown();
      process.exit(130);
    });

    exitPromise = new Promise((_, reject) => {
      devServer.once('error', reject);
      devServer.once('exit', (code) => {
        reject(
          new Error(
            [
              `Dev server exited before becoming ready (code: ${code ?? 'unknown'})`,
              devLogs.join(''),
            ]
              .filter(Boolean)
              .join('\n')
          )
        );
      });
    });
  }

  try {
    if (SKIP_SERVER) {
      console.log(`Using existing dev server at ${BASE_URL}`);
    } else {
      await Promise.race([waitForServer(BASE_URL), exitPromise]);
    }

    runPlaywrightCli(['open', `${BASE_URL}/`]);
    runPlaywrightCli([
      'run-code',
      `
        await page.getByText(/Web Runtime|Desktop Runtime/i).waitFor();
        const bodyText = await page.locator('body').innerText();
        if (!bodyText.includes('Quick Start') && !bodyText.includes('快速开始')) {
          throw new Error('Dashboard quick start section was not rendered');
        }
      `,
    ]);

    runPlaywrightCli(['open', `${BASE_URL}/diff`]);
    runPlaywrightCli([
      'run-code',
      `
        await page.locator('#diff-original').fill('alpha\\nbeta');
        await page.locator('#diff-modified').fill('alpha\\ngamma');
        await page.getByText(/对比结果|Diff Result/).waitFor();
        const bodyText = await page.locator('body').innerText();
        if (!bodyText.includes('+1') || !bodyText.includes('-1')) {
          throw new Error('Diff counts were not rendered');
        }
      `,
    ]);

    runPlaywrightCli(['open', `${BASE_URL}/formatter/http`]);
    runPlaywrightCli([
      'run-code',
      `
        await page.getByText(/输入 HTTP 报文 \\/ cURL 命令|Input HTTP message/i).waitFor();
        await page.locator('textarea').first().fill('GET /health HTTP/1.1\\nHost: example.com\\nAccept: application/json');
        await page.getByRole('button', { name: /格式化|Format/i }).click();
        await page.getByText(/格式化结果|Output/i).waitFor();
      `,
    ]);

    runPlaywrightCli(['open', `${BASE_URL}/regex/replace`]);
    runPlaywrightCli([
      'run-code',
      `
        await page.getByText(/替换为|Replace With/i).waitFor();
        await page.getByPlaceholder(/输入正则表达式|Enter regex pattern/i).fill('(foo)');
        await page.getByPlaceholder(/替换文本|Replacement text/i).fill('$1-bar');
        await page.getByPlaceholder(/输入要处理的文本|Enter text to process/i).fill('foo baz foo');
        await page.getByDisplayValue('foo-bar baz foo-bar').waitFor();
      `,
    ]);

    runPlaywrightCli(['open', `${BASE_URL}/qrcode/generate`]);
    runPlaywrightCli([
      'run-code',
      `
        await page.getByPlaceholder(/输入要生成二维码的文本|Enter text, URL/i).fill('https://example.com/toolsbox');
        await page.locator('img[alt="QR Code"]').waitFor();
        const src = await page.locator('img[alt="QR Code"]').getAttribute('src');
        if (!src || !src.startsWith('data:image/')) {
          throw new Error('QR preview image was not generated');
        }
      `,
    ]);

    runPlaywrightCli(['open', `${BASE_URL}/time/uuid`]);
    runPlaywrightCli([
      'run-code',
      `
        await page.getByText(/UUID v1/i).waitFor();
        const firstValue = await page.locator('code').first().innerText();
        await page.getByRole('button', { name: /刷新全部|Refresh All/i }).click();
        await page.waitForTimeout(150);
        const refreshedValue = await page.locator('code').first().innerText();
        if (!firstValue || firstValue === refreshedValue) {
          throw new Error('UUID list did not refresh');
        }
      `,
    ]);

    runPlaywrightCli(['close']);
    console.log('Playwright smoke flow passed');
  } finally {
    shutdown();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
