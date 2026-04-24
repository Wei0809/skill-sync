const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const ROOT = __dirname;
const SERVER_PORT = 3456;
const VITE_PORT = 5173;

function startBackend() {
  const proc = spawn('npm', ['start'], {
    cwd: path.join(ROOT, 'server'),
    stdio: 'inherit',
    shell: true,
  });
  proc.on('exit', (code) => {
    console.log(`[backend] exited with code ${code}`);
    process.exit(code ?? 1);
  });
  return proc;
}

function startFrontend() {
  const proc = spawn('npm', ['run', 'dev'], {
    cwd: path.join(ROOT, 'client'),
    stdio: 'inherit',
    shell: true,
  });
  proc.on('exit', (code) => {
    console.log(`[frontend] exited with code ${code}`);
    process.exit(code ?? 1);
  });
  return proc;
}

function openBrowser(url) {
  const cmd = process.platform === 'win32' ? 'start'
    : process.platform === 'darwin' ? 'open'
    : 'xdg-open';
  spawn(cmd, [url], { shell: true, stdio: 'ignore' }).unref();
}

function waitUntilReady(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      http.get(url, (res) => {
        res.resume();
        resolve();
      }).on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error(`Timeout waiting for ${url}`));
        } else {
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

async function main() {
  console.log('Starting Skill Sync...\n');

  const backend = startBackend();
  const frontend = startFrontend();

  // Wait for backend to be ready, then open browser
  try {
    await waitUntilReady(`http://localhost:${VITE_PORT}`);
    console.log(`\n✅ Ready! Opening http://localhost:${VITE_PORT}`);
    openBrowser(`http://localhost:${VITE_PORT}`);
  } catch {
    console.log('\n⚠️  Frontend took too long to start, open http://localhost:5173 manually');
  }

  // Graceful shutdown
  const shutdown = () => {
    console.log('\nShutting down...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
