const LEVELS = { INFO: 'INFO ', WARN: 'WARN ', ERROR: 'ERROR' };

const fmt = (level, tag, msg) => `[${new Date().toISOString()}] ${level} [${tag}] ${msg}`;

const logger = {
  info(tag, msg, ctx) {
    const line = fmt(LEVELS.INFO, tag, msg);
    if (ctx !== undefined && ctx !== null) {
      console.log(line, ctx);
    } else {
      console.log(line);
    }
  },

  warn(tag, msg, ctx) {
    const line = fmt(LEVELS.WARN, tag, msg);
    if (ctx !== undefined && ctx !== null) {
      console.warn(line, ctx);
    } else {
      console.warn(line);
    }
  },

  error(tag, msg, err, ctx) {
    const line = fmt(LEVELS.ERROR, tag, msg);
    const errOut = err
      ? err instanceof Error
        ? { message: err.message, stack: err.stack }
        : err
      : undefined;
    if (ctx !== undefined && ctx !== null) {
      console.error(line, errOut, ctx);
    } else if (errOut !== undefined) {
      console.error(line, errOut);
    } else {
      console.error(line);
    }
  },
};

export default logger;
