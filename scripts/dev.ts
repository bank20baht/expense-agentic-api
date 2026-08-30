/**
 * Run every workspace `dev` script in parallel with prefixed, live-streamed
 * output. Replaces `bun run --filter '*' dev`, which serializes long-running
 * scripts and never starts the second one.
 */
const targets = [
  { name: 'server', cwd: 'apps/server', color: '\x1b[36m' },
  { name: 'web', cwd: 'apps/web', color: '\x1b[35m' },
]
const reset = '\x1b[0m'

const procs = targets.map(({ name, cwd, color }) => {
  const proc = Bun.spawn(['bun', 'run', 'dev'], {
    cwd,
    env: process.env,
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const prefix = (line: string) => `${color}[${name}]${reset} ${line}`
  const pump = async (stream: ReadableStream<Uint8Array>) => {
    const decoder = new TextDecoder()
    let buf = ''
    for await (const chunk of stream) {
      buf += decoder.decode(chunk, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) console.log(prefix(line))
    }
    if (buf) console.log(prefix(buf))
  }

  pump(proc.stdout)
  pump(proc.stderr)
  return proc
})

const shutdown = () => {
  for (const p of procs) p.kill()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

await Promise.all(procs.map((p) => p.exited))
