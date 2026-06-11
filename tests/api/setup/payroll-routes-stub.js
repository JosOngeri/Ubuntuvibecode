/**
 * Stub for payroll.routes.js - used in tests to avoid loading the broken payroll controller.
 */
const express = require('D:\\0000 SCO400 Project 2026\\Ubuntu Software\\backend\\node_modules\\express');
const router = express.Router();
// Use (.*) instead of * for path-to-regexp v8+ compatibility
router.use((req, res) => res.status(503).json({ msg: 'Payroll module under maintenance' }));
module.exports = router;
