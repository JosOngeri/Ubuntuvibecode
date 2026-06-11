# ADR 001: Three-Layer Architecture for Backend

## Status
Accepted

## Context
The original backend codebase had controllers that directly interacted with models and contained significant business logic. This made the code difficult to test, maintain, and scale. Controllers were doing too much - handling HTTP requests, business logic, and data access all in one place.

## Decision
Adopt a three-layer architecture pattern:
- **Controllers**: Handle HTTP requests/responses only
- **Services**: Contain business logic and coordinate between repositories
- **Repositories**: Handle data access (SQL queries) only

## Consequences
### Positive
- Separation of concerns makes code easier to understand
- Business logic is isolated and testable
- Data access is centralized and can be mocked easily
- Controllers become thin and focused on HTTP concerns
- Easier to onboard new developers

### Negative
- More files and directories to navigate
- Initial refactoring effort required
- More boilerplate code for simple operations

## Implementation
- Created `src/features/{feature}/{controllers,services,repositories}/` structure
- Moved business logic from controllers to services
- Moved SQL queries from controllers/services to repositories
- Controllers now delegate to services, services delegate to repositories
