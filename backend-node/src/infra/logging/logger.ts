/**
 * Pino logger configuration.
 *
 * We expose two helpers:
 *   - `buildLoggerOptions(config)`: structured options Fastify uses to construct
 *     its internal pino instance (preferred wiring — keeps Fastify's logger
 *     generics happy).
 *   - `buildStandaloneLogger(config)`: a plain pino logger for code paths that
 *     run outside the Fastify request lifecycle (CLI scripts, workers).
 *
 * Redaction paths come from config and are the *only* sanctioned place to
 * configure log redaction.
 */
import pino, { type Logger, type LoggerOptions } from 'pino';
import type { Config } from '../../app/config.js';

export function buildLoggerOptions(config: Config): LoggerOptions {
  const base: LoggerOptions = {
    level: config.LOG_LEVEL,
    redact: {
      paths: config.LOG_REDACT_PATHS,
      censor: '[REDACTED]',
      remove: false,
    },
    base: {
      env: config.NODE_ENV,
      service: 'backend',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      },
    },
  };

  if (config.NODE_ENV !== 'production' && config.PRETTY_LOGS) {
    return {
      ...base,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: false,
          translateTime: 'SYS:HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      },
    };
  }

  return base;
}

export function buildStandaloneLogger(config: Config): Logger {
  return pino(buildLoggerOptions(config));
}
