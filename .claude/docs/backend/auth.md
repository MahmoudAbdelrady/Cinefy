# Authentication: login, sessions, OTP, OAuth

Security plumbing (filters, cookies, auth contexts) is in [security.md](security.md).

## Sessions

- Two controllers: `ManagementAuthController` (`/management/auth`, staff) and `ClientAuthController` (`/client/auth`, customers). Both are `@PublicApi` except `/logout`.
- Session, refresh and logout delegate to `JwtSessionService`.
- Cookies are built by `AuthCookieResponseFactory` under the controller's `AuthContext`. Login and token rotation set all three (access, refresh, CSRF); a refresh that doesn't rotate resets only the access cookie (refresh and CSRF are set only when the token pair carries a refresh token). Logout clears all three.
- `/logout` isn't `@PublicApi`: it needs a valid access cookie and the CSRF header, so an expired session gets a 401 before the controller runs.
- `GET /session` returns 204 if the refresh cookie is valid, else 401. `POST /refresh` issues a new access cookie and rotates the refresh token once it passes `refresh-token-rotation-threshold`.
- Logout blocklists both tokens in `InvalidJwt` (pruned daily by `InvalidJwtCleanupJob`).
- The bootstrap `ADMIN` account is seeded at startup by a `CommandLineRunner` in `CinefyApplication`.

## OTP flows

OTPs live in Redis through `CacheService` (`OtpType`: `EMAIL_VERIFICATION`, `RESET_PASSWORD`) and are emailed by `EmailService`. Three entries per user and type:

- `otp:cooldown:<userId>:<userType>:<type>` → the concurrency gate, with a 100 ms TTL. Claimed with `addIfAbsent`.
- `otp:code:<code>` → an `OtpEntry` record (`code`, `userId`, `userType`, `type`), with a TTL of `cinefy.otp.expiration-minutes`. Written with `addIfAbsent`, which also keeps codes unique.
- `otp:user:<userId>:<userType>:<type>` → the user's current code, with the same TTL as the code entry.

`OtpService.create` first claims the cooldown entry. If it's already taken (another `create` for the same user and type ran within the last 100 ms), it returns `null` and callers send no email, so concurrent requests produce a single code. Otherwise it writes the new code entry, points the user entry at it, and deletes the previous code entry: every non-concurrent request issues a fresh code with a fresh TTL and invalidates the old one. There is no resend cooldown. Only one request per user and type gets past the gate, so the read-then-write on the user entry can't race. `validate` throws `OTP_INVALID` for a missing code or a code of another type. `consume(OtpEntry)` deletes all three entries and throws `OTP_INVALID` (422) if the code entry was already gone (expired, or consumed by a concurrent request). Redis deletes can't roll back with a DB transaction, so callers (`resetPassword` in both auth services, `verifyAccount`) run `validate` → the DB change → `consume`, all inside their `@Transactional` method. A failed DB change never reaches `consume`, so the code stays usable; a failed `consume` rolls back the DB change, so only the request that actually consumed the code commits. The one gap: the transaction commits after `consume`, so a failed commit still uses up the code.

- **Staff password reset:** `forgot-password` → `verify-reset-code` → `reset-password`. `forgotPassword` skips an `ADMIN` target early (no OTP, no email); `updatePassword` still guards independently.
- **Client sign-up:** `sign-up` creates an **unverified** client, emails an OTP and returns **201** with no body; `verify-account` verifies it and sets cookies (or 422 `OTP_INVALID` if the OTP was already consumed concurrently). An unverified client can't log in.
- **Client password reset:** `send-otp` → `verify-otp` → `reset-password`.
- Password changes go through `applyNewPassword` (shared by change-password and OTP reset), which owns the `PASSWORD_REUSED` check. A wrong current password is `PASSWORD_INCORRECT`.

## OAuth2 social sign-in

Client app only. `shared/oauth/` holds an abstract `OAuthProviderClient` over `RestClient` with `GoogleOAuthClient` and `MicrosoftOAuthClient`. `OAuthProviderClientFactory.getClient(OAuthProvider)` uses an exhaustive `switch` with no `default`, so a new enum constant breaks the build until handled.

- The base class owns the `state` handshake, the `oauthState` cookie, and 5s/10s connect/read timeouts. Subclasses supply endpoints, scopes and JSON field names.
- Scopes: Google `openid email profile`; Microsoft `openid email profile User.Read`.
- Google additionally **requires `email_verified`**. Microsoft reads `mail`, falling back to `userPrincipalName`.
- JSON is parsed with `tools.jackson.databind.JsonNode` (Jackson 3).

### Endpoints

| Endpoint                                                           | Effect                                                                             |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `GET /client/auth/oauth/{provider}/authorization-url?redirectUrl=` | Returns a `RedirectionDTO` and sets the `oauthState` cookie                        |
| `POST /client/auth/oauth/callback`                                 | `OAuthCallbackDTO` + `oauthState` cookie → signed in, 403, or a registration token |
| `POST /client/auth/oauth/sign-up`                                  | `{registrationToken, phoneNumber}` → creates the client and sets auth cookies      |

`{provider}` must be exactly `GOOGLE` or `MICROSOFT` (`OAuthProvider.fromString` is case-sensitive); anything else is a 422.

**The redirect target is the frontend.** `cinefy.oauth.redirect-uri` is a path appended to the client URL; the provider sends the browser to an Angular route that POSTs `code`/`state` to `/oauth/callback`. There is no backend GET callback.

**`state` is split across the wire and a cookie.** The provider gets `state = base64url(<PROVIDER>:<uuid>[:<redirectUrl>])` (no padding); only the uuid is stored in the HttpOnly `oauthState` cookie (10-minute max-age). On callback, `parseState` decodes it and splits it into at most three parts, and `validateState` compares the uuid halves with `MessageDigest.isEqual`. The optional `redirectUrl` is sanitized by `toSafeRedirect` (same-origin paths only) and handed back to the frontend in the callback response.

**The `oauthState` cookie is cleared only on the 200 outcomes.** The controller builds the cleared cookie after the service returns, so error outcomes (403, 422) leave it to expire.

**Three callback outcomes**, keyed on the provider's email:

- **Known + verified** → 200 with auth cookies and `OAuthCallbackResponseDTO { redirectUrl? }`.
- **Known + unverified** → sends an `EMAIL_VERIFICATION` OTP and throws `ForbiddenException` (403) with `ACCOUNT_NOT_VERIFIED` and `data { email, redirectUrl? }`, so the frontend can prefill its OTP screen.
- **Unknown** → 200 with `OAuthCallbackResponseDTO { registration: OAuthRegistrationDTO { registrationToken, email, firstName, lastName }, redirectUrl? }` (`@JsonInclude(NON_NULL)`).

**The registration token is stateless.** `issueRegistrationToken` serializes `OAuthRegistrationToken(email, firstName, lastName, expiresAt)` and encrypts it with `CredentialCipher`. Nothing is persisted and no cookie is set; `/oauth/sign-up` rejects it if it fails to decrypt or has expired. Sign-up only asks for the one field providers don't supply: `phoneNumber`.

**OAuth clients are created verified and password-less** (`ClientService.createOAuthClient`). `changePassword` branches on `Client.hasPassword()`: a password-less client may set one without a current password. `CurrentClientDTO.hasPassword` lets the UI show "set" vs "change". Older databases need the [nullable-password migration](manual-migrations.md#nullable-password-oauth-clients).

## Client profile

`ClientController` (`/client`, `CLIENT` only): `GET`/`PUT /me`, `PUT /me/password`, list and delete saved cards (`/me/payment-methods`). Phone numbers are normalized with libphonenumber, then checked with `existsByPhoneNumberAndIdNot` so the client's own row doesn't collide. There is no delete-account endpoint.
