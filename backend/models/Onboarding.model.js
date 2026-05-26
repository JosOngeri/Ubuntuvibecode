const { Pool } = require('pg');

const pool = require('../config/db').pool;

const ONBOARDING_TABLE = 'onboarding';

const ensureColumns = async () => {
  await pool.query(`ALTER TABLE ${ONBOARDING_TABLE} ADD COLUMN IF NOT EXISTS orientation_checklist JSONB`);
};

const Onboarding = {
  async init() {
    await ensureColumns();
  },
};

module.exports = Onboarding;
