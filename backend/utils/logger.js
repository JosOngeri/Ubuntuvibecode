const LEVELS = { INFO: 'INFO ', WARN: 'WARN ', ERROR: 'ERROR' };

const fmt = (level, tag, msg) =>
  `[${new Date().toISOString()}] ${level} [${tag}] ${msg}`;

const logger = {
  info(tag, msg, ctx) {
    const line = fmt(LEVELS.INFO, tag, msg);
    if (ctx !== undefined && ctx !== null && Object.keys(ctx).length > 0) {
      console.log(line, ctx);
    } else {
      console.log(line);
    }
  },

  warn(tag, msg, ctx) {
    const line = fmt(LEVELS.WARN, tag, msg);
    if (ctx !== undefined && ctx !== null && Object.keys(ctx).length > 0) {
      console.warn(line, ctx);
    } else {
      console.warn(line);
    }
  },

  error(tag, msg, err, ctx) {
    const line = fmt(LEVELS.ERROR, tag, msg);
    const errOut = err ? (err.stack || String(err)) : '';
    if (ctx !== undefined && ctx !== null && Object.keys(ctx).length > 0) {
      console.error(line, errOut, ctx);
    } else {
      console.error(line, errOut);
    }
  },
};

module.exports = logger;
