import winston from "winston";
import "winston-daily-rotate-file";

const { combine, timestamp, printf, errors, json, align } = winston.format;

// Custom log format
const customLogFormat = printf(
  ({ level, message, cause, timestamp, stack, meta }) => {
    // const logMessage = {
    //   timestamp,
    //   level,
    //   message,
    //   ...(cause && { cause }),
    //   ...(stack && { stack }), // Include stack trace for errors
    //   ...(meta && { meta }), // Include additional metadata if present
    // };

    const logMessage = `[${timestamp}] ${level}: ${message}`;
    const causeMessage = cause ? ` Cause: ${JSON.stringify(cause)}` : "";
    const stackMessage = stack ? ` Stack: ${stack}` : "";
    const metaMessage = meta ? ` Meta: ${JSON.stringify(meta)}` : "";
    return `${logMessage}${causeMessage}${stackMessage}${metaMessage}`;

    //return `[${timestamp}] ${level}: ${message} ${cause && { cause }} ${stack && { stack }} ${meta && { meta }}`;
    //return JSON.stringify(logMessage);
  }
);

const logsPath = process.env.LOGS_PATH || "./logs";

// File rotation for daily logs
const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: `${logsPath}/application-%DATE%.log`,
  datePattern: "YYYY-MM-DD",
});

// Console transport for development
const consoleTransport = new winston.transports.Console({
  format: combine(
    winston.format.colorize(),
    printf(({ level, message, timestamp }) => {
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    errors({ stack: true }),
    timestamp({
      format: "YYYY-MM-DD hh:mm:ss.SSS A",
    }),
    align(),
    json(),
    customLogFormat
  ),
  transports: [
    fileRotateTransport,
    ...(process.env.NODE_ENV != "production" ? [consoleTransport] : []),
  ],
});

export default logger;
