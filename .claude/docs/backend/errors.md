# Errors and status codes

`CinefyExceptionHandler` (`@RestControllerAdvice`) maps exceptions to `CinefyExceptionResponse { message, errorCode, data }` (built by `ExceptionResponseMaker`):

| Exception                                            | Status  | Notes                                                                          |
| ---------------------------------------------------- | ------- | ------------------------------------------------------------------------------ |
| `BusinessException`                                  | **422** | Optional `ErrorCode`, sent as JSON `errorCode`                                 |
| `BindException`, `ConstraintViolationException`      | **422** | `"Validation Error"`; the field errors are in `data` as `[{ field, message }]` |
| `HttpMessageNotReadableException`                    | **400** | `"Malformed request body"` — the only 400                                      |
| `NotFoundException`                                  | 404     |                                                                                |
| `ConflictException`                                  | 409     | Same shape as `BusinessException`, optional `ErrorCode`                        |
| `DataIntegrityViolationException`                    | 409     | `"A record with the same unique value already exists"`                         |
| `AuthenticationException`                            | 401     | Fixed message `"Invalid email or password"`                                    |
| `JwtException`                                       | 401     | Fixed message `"Invalid or expired token"`                                     |
| `UnauthorizedException`                              | 401     |                                                                                |
| `ForbiddenException`, `AuthorizationDeniedException` | 403     | `ForbiddenException` has an optional `ErrorCode` and optional `Object data`    |
| Any other `Exception`                                | 500     | Message hidden in production                                                   |

When Redis fails, `CacheService` wraps the `DataAccessException` in a plain `RuntimeException("Cache is unavailable")`, which reaches the 500 catch-all (`"Something went wrong"` in production).

Responses produced outside the handler:

- Unauthenticated request to a protected endpoint → 401 `"Authentication required"` (`CinefyAuthenticationEntryPoint`).
- Failed CSRF check → 403 `"Invalid CSRF token"` (`CsrfValidationFilter`).
- Rate limit exceeded → 429 `"Too many requests, please try again later"` (`RateLimitInterceptor`).

**Unhandled request errors fall through to the 500 catch-all:** a wrong content type (`HttpMediaTypeNotSupportedException`), a missing required query parameter (`MissingServletRequestParameterException`), or a mistyped path/query parameter (`MethodArgumentTypeMismatchException`) all return 500 today.

## Rules

- **Everything the server understood but refused is 422** — domain rules and field validation alike. 400 is only for request bodies that couldn't be read (invalid JSON). A frontend telling "domain rule" from "bad field" reads the body: business errors carry `errorCode`, validation errors carry the `data` list.
- **Add an `ErrorCode` only when the frontend must branch on which error it got.** Current codes: `OTP_INVALID`, `PASSWORD_REUSED`, `PASSWORD_INCORRECT`, `PAYMENT_NOT_ATTEMPTED` (all 422), and `ACCOUNT_NOT_VERIFIED` (thrown with `ForbiddenException`, so 403).
- **`ConflictException` is thrown only inside a `catch (DataIntegrityViolationException …)`** — a constraint the DB actually rejected. The booking path's catch also covers `ObjectOptimisticLockingFailureException`. A failed `existsBy*` pre-check is ordinary validation: `BusinessException` → 422.
- The validation handler is registered on `BindException`, not its subclass `MethodArgumentNotValidException`, so it covers both `@Valid @RequestBody` and `@Valid @ModelAttribute` query binding (the latter throws the superclass).
- **An empty response body is 204, never 200** — `ResponseEntity.noContent()`, even when setting headers (`AuthCookieResponseFactory` sets cookies on a 204). A read returning an empty list is still **200 `[]`**. Exceptions in the code today: `POST /client/auth/sign-up` returns **201** with no body, and `GET /booking/payment-redirect` is a 302.
- `ForbiddenException`'s `data` payload is used by the OAuth callback: a map with `email` and, when the flow carried one, `redirectUrl`, alongside `ACCOUNT_NOT_VERIFIED`.
