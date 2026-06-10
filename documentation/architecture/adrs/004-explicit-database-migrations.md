# ADR 004: Explicit Database Migrations

## Status
Accepted

## Context
The original codebase used `ensureColumns()` functions in models to dynamically add columns at runtime. This was an anti-pattern that caused:
- Schema drift between environments
- Unexpected behavior in production
- Difficulty tracking schema changes
- No version control for database structure

## Decision
Use explicit database migrations instead of runtime schema changes:
- All schema changes must be in migration files
- Migrations are versioned and timestamped
- Migrations are run explicitly during deployment
- No `ensureColumns()` or dynamic ALTER TABLE in application code

## Consequences
### Positive
- Schema is version-controlled
- Consistent schema across environments
- Predictable deployments
- Can roll back schema changes
- Clear audit trail of schema changes

### Negative
- Need to manage migration execution
- More upfront planning required
- Migration files add to codebase

## Implementation
- Created `migrations/` directory with timestamped SQL files
- Removed all `ensureColumns()` calls from models
- Added foreign key constraints in migrations
- Added performance indexes in migrations
- Migrations use `IF NOT EXISTS` for safety
