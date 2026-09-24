import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const playwrightBin = path.join(
  root,
  'node_modules',
  '@playwright',
  'test',
  'cli.js',
)

const server = spawn(
  process.execPath,
  [viteBin, '--host', '127.0.0.1', '--port', '5173'],
  {
    cwd: root,
    stdio: 'inherit',
  },
)

async function waitForServer() {
  const deadline = Date.now() + 30_000

  while (Date.now() < deadline) {
    try {
      const response = await fetch('http://127.0.0.1:5173')
      if (response.ok) {
        return
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }

  throw new Error('Vite did not start within 30 seconds')
}

async function stopServer() {
  if (server.exitCode !== null) {
    return
  }

  if (process.platform === 'win32') {
    await new Promise((resolve) => {
      const taskkill = path.join(
        process.env.SystemRoot ?? 'C:\\Windows',
        'System32',
        'taskkill.exe',
      )
      const killer = spawn(
        taskkill,
        ['/pid', String(server.pid), '/T', '/F'],
        { stdio: 'ignore' },
      )
      killer.on('error', resolve)
      killer.on('exit', resolve)
    })
    return
  }

  server.kill('SIGTERM')
}

try {
  await waitForServer()

  const exitCode = await new Promise((resolve, reject) => {
    const testProcess = spawn(
      process.execPath,
      [playwrightBin, 'test', ...process.argv.slice(2)],
      {
        cwd: root,
        stdio: 'inherit',
      },
    )

    testProcess.on('error', reject)
    testProcess.on('exit', (code) => resolve(code ?? 1))
  })

  await stopServer()
  process.exit(exitCode)
} catch (error) {
  await stopServer()
  console.error(error)
  process.exit(1)
}
