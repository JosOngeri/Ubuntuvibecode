const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../logs/system.log');

function appendToFile(line) {
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (_) {}
}

const logger = {
  info: (tag, msg, ctx = {}) => {
    const line = `[${new Date().toISOString()}] INFO  [${tag}] ${msg}${Object.keys(ctx).length ? ' ' + JSON.stringify(ctx) : ''}`;
    console.log(line);
    appendToFile(line);
  },
  warn: (tag, msg, ctx = {}) => {
    const line = `[${new Date().toISOString()}] WARN  [${tag}] ${msg}${Object.keys(ctx).length ? ' ' + JSON.stringify(ctx) : ''}`;
    console.warn(line);
    appendToFile(line);
  },
  error: (tag, msg, err, ctx = {}) => {
    const errDetail = err?.stack || (err ? String(err) : '');
    const line = `[${new Date().toISOString()}] ERROR [${tag}] ${msg} ${errDetail}${Object.keys(ctx).length ? ' ' + JSON.stringify(ctx) : ''}`;
    console.error(line);
    appendToFile(line);
  },
};

module.exports = logger;
