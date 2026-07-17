/**
 * Repora structured logger.
 *
 * A small, dependency-free leveled logger that replaces ad-hoc `console.*`
 * calls across the backend. Features:
 *  - Log levels: trace < debug < info < warn < error
 *  - Namespaced child loggers (e.g. `logger.child('Hermes')`)
 *  - Timestamps + level prefix in every line
 *  - Color output when stderr is a TTY (disabled in CI / tests / piping)
 *  - Level controlled by LOG_LEVEL env var (default: info in prod, debug otherwise)
 *  - Optional JSON output via LOG_FORMAT=json (useful for container log aggregation)
 */

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error'

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
}

function resolveLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL || '').toLowerCase().trim()
  if (raw in LEVEL_WEIGHT) return raw as LogLevel
  if (process.env.NODE_ENV === 'production') return 'info'
  if (process.env.NODE_ENV === 'test') return 'error'
  return 'debug'
}

const USE_COLORS = Boolean(process.stderr.isTTY) && process.env.NO_COLOR == null
const JSON_FORMAT = process.env.LOG_FORMAT === 'json'

const COLORS: Record<LogLevel, string> = {
  trace: '\x1b[90m', // gray
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m', // green
  warn: '\x1b[33m', // yellow
  error: '\x1b[31m', // red
}
const RESET = '\x1b[0m'

function nowIso(): string {
  return new Date().toISOString()
}

function levelFromEnv(): LogLevel {
  return resolveLevel()
}

function formatArgs(args: unknown[]): string {
  return args
    .map((a) => {
      if (typeof a === 'string') return a
      if (a instanceof Error) return `${a.name}: ${a.message}${a.stack ? `\n${a.stack}` : ''}`
      try {
        return JSON.stringify(a)
      } catch {
        return String(a)
      }
    })
    .join(' ')
}

export class Logger {
  private readonly ns: string
  private readonly level: LogLevel

  constructor(ns = 'repora', level: LogLevel = levelFromEnv()) {
    this.ns = ns
    this.level = level
  }

  child(ns: string): Logger {
    const childNs = this.ns ? `${this.ns}:${ns}` : ns
    return new Logger(childNs, this.level)
  }

  private enabled(level: LogLevel): boolean {
    return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[this.level]
  }

  private emit(level: LogLevel, args: unknown[]): void {
    if (!this.enabled(level)) return
    const msg = formatArgs(args)
    if (JSON_FORMAT) {
      process.stderr.write(
        JSON.stringify({ ts: nowIso(), level, ns: this.ns, msg }) + '\n',
      )
      return
    }
    const ts = nowIso().slice(11, 23) // HH:mm:ss.mmm
    const prefix = USE_COLORS ? `${COLORS[level]}[${level.toUpperCase()}]${RESET}` : `[${level.toUpperCase()}]`
    const nsPart = this.ns ? ` (${this.ns})` : ''
    const out = `${prefix} ${ts}${nsPart} ${msg}\n`
    if (level === 'error' || level === 'warn') {
      process.stderr.write(out)
    } else {
      process.stdout.write(out)
    }
  }

  trace(...args: unknown[]): void {
    this.emit('trace', args)
  }
  debug(...args: unknown[]): void {
    this.emit('debug', args)
  }
  info(...args: unknown[]): void {
    this.emit('info', args)
  }
  warn(...args: unknown[]): void {
    this.emit('warn', args)
  }
  error(...args: unknown[]): void {
    this.emit('error', args)
  }
}

export const logger = new Logger()
