import pino from "pino";

/**
 * Strukturiertes Logging (pino).
 *
 * DATENSCHUTZ: In Logs dürfen KEINE patientenbezogenen Daten (PII) landen.
 * Sensible Felder werden über `redact` maskiert. Logge stattdessen IDs.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: [
      "*.password",
      "*.passwordHash",
      "*.ahvNr",
      "*.phone",
      "*.email",
      "*.dateOfBirth",
      "*.firstName",
      "*.lastName",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "[REDACTED]",
  },
  transport:
    process.env.LOG_JSON === "true" || process.env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } },
});

export default logger;
