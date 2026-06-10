# ADR 002: Feature-Based Folder Organization

## Status
Accepted

## Context
The original codebase organized files by technical layer (controllers/, models/, routes/). This made it difficult to find all files related to a specific feature. A developer had to jump between multiple directories to understand a single feature's implementation.

## Decision
Organize code by feature/domain instead of technical layer:
- `src/features/{feature}/{controllers,services,repositories,validators}/`
- Each feature is self-contained with its own layers
- Shared utilities go in `src/shared/`

## Consequences
### Positive
- All code for a feature is in one place
- Easier to understand feature boundaries
- Simplifies feature extraction/removal
- Better for team collaboration (teams can own features)
- Clearer mental model of the system

### Negative
- May duplicate some utility code across features
- Need to be careful about shared code placement
- More directory nesting

## Implementation
- Created feature folders for: auth, recruitment, attendance, payroll, employees, leave
- Each feature has subfolders: controllers, services, repositories, validators
- Shared code in: utils, middleware, errors, services
