# ADR 003: Standardized API Response Format

## Status
Accepted

## Context
The original API responses had inconsistent formats. Some endpoints returned `{ data: ... }`, others returned `{ msg: ... }`, some had nested structures. This made frontend integration difficult and error handling inconsistent.

## Decision
Implement a standardized API response format using a utility function:
- All responses follow: `{ success: boolean, message: string, data: any }`
- Use helper functions: `success()`, `created()`, `badRequest()`, `notFound()`, `serverError()`
- Consistent HTTP status codes

## Consequences
### Positive
- Consistent response format across all endpoints
- Easier frontend integration
- Better error handling
- Clear separation of success/error states
- Type-safe response handling

### Negative
- All existing endpoints need to be updated
- Slightly more verbose response construction

## Implementation
- Created `src/shared/utils/response.js` with helper functions
- Functions handle both success and error cases
- Includes proper HTTP status codes
- All new controllers must use this utility
