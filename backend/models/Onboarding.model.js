const { Pool } = require('pg');

const pool = require('../config/db').pool;

const ONBOARDING_TABLE = 'onboarding';

// DEPRECATED: ensureColumns() removed to prevent schema drift
// All columns now managed via proper migration files in backend/migrations/
// See migration: 20240602000003_add_onboarding_columns.sql
/*
const ensureColumns = async () => {
  await pool.query(`ALTER TABLE ${ONBOARDING_TABLE} ADD COLUMN IF NOT EXISTS orientation_checklist JSONB`);
};
*/

const Onboarding = {
  async init() {
    // ensureColumns() removed - columns managed via migrations
  },
};

module.exports = Onboarding;
