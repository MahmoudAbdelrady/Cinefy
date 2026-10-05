# Payments: gateways and Paymob

## Layers

- **`PaymobClient`** (`shared/payment/`) — Unified Checkout client over `RestClient` (`app.paymob.api-base-url`): `createIntention`, `getUnifiedCheckoutUrl`, `pay` (saved-card charge via `source.subtype = TOKEN`), `refund` (tries **void** first, falls back to **refund**), `parseRedirect` (flat browser query params), `parseCallback` (webhook JSON → sealed `PaymentCallbackData`: `TRANSACTION` → `TransactionCallbackDTO`, any other `type` → `CardTokenCallbackDTO`), `readOrderReference` (two overloads: nested webhook vs flat redirect), plus config-time `resolveCredentials` / `readPublicCredentials` / `validateChannelConfig`.
- **`PaymentService`** — the booking-facing flow: `createCheckout`, `payWithSavedCard`, `refundTransaction`, `handleCallback`, `handleRedirect`.
- **`ClientPaymentMethodService`** — persists tokenized cards (see [bookings.md](bookings.md#saved-cards)).
- **`PaymentGatewayService`** — gateway CRUD and activation.

**Every inbound Paymob payload is HMAC-SHA512 verified** over an ordered field concatenation, compared with `MessageDigest.isEqual` — webhooks, redirects, and the saved-card `pay` response. A mismatch or a missing HMAC throws `BusinessException("Invalid payment signature")`.

**Order reference:** `bookingUuid_gatewayUuid_timestampMillis` (built in `PaymentService`). `resolveGateway` reads segment 1 and falls back to the active gateway if it's missing.

**Provider-agnostic call sites.** Every secret-taking `PaymobClient` method takes `GatewayProviderCredentials`, never a raw key, and casts to `PaymobGateway.Credentials` on its first line. That keeps `PaymobGateway.*` types out of `PaymentService`, so a second provider needs a new spec + client, not call-site changes.

**Intentions.** `createIntention` takes the gateway's channels and derives `currency` + `payment_methods` from the **active** ones (`readChannelCurrency` / `readIntegrationIds`). Those fields aren't on `PaymobIntentionRequestDTO`; they're injected into the JSON body at send time via `objectMapper.valueToTree`. Active channels that disagree on currency throw — one intention carries one currency. Intentions expire after 600s.

## Callbacks

- `POST /booking/payment-callback` (webhook) is the **source of truth**. `handlePaymentCallback` pattern-matches the sealed `PaymentCallbackData`: transactions go to `bookingService.applyPaymentResult(...)`, card tokens to `clientPaymentMethodService.createMethod(...)`. The body is a Jackson 3 `JsonNode`.
- `GET /booking/payment-redirect` is only the browser's return leg (302 to the frontend). Paymob's cancel button calls it with an **empty** param map, so `handleRedirect` returns null on empty input and the service falls back to the client home URL instead of failing HMAC.

## Gateway CRUD (`/payment-gateways`, ADMIN/MANAGER)

Create/update body (`active` is not an input — new gateways start inactive; activation is `POST /{uuid}/status`):

```json
{
  "name": "Main Paymob",
  "provider": "PAYMOB",
  "credentials": { "secretKey": "...", "publicKey": "...", "hmacKey": "..." },
  "paymentChannels": [
    { "name": "Cards", "currency": "EGP", "active": true, "providerConfig": { "integrationId": 12345 } }
  ]
}
```

- Write DTO: `name` is `@NotBlank`, `@Size(max = 60)` and matches `RESOURCE_NAME`. `credentials` is `Map<String, Object>` and `paymentChannels` is `List<Map<String, Object>>` — both untyped on purpose (below).
- `POST /{uuid}/status` takes `{ "active": Boolean }` (`@NotNull`); setting the current state again → 422 ("already active/deactivated").
- `GET` returns `PaymentGatewayListDTO { active, standBy }`, partitioned in one pass. `@JsonInclude(NON_NULL)`, so `active` is **omitted** when none is active. `GET /active` **404s** instead.
- **Responses never contain `secretKey`/`hmacKey`**, not even as nulls: mappers run credentials through `PaymobClient.readPublicCredentials(...)`, and `PaymobGateway.Credentials` is `@JsonInclude(NON_NULL)`.
- On create, `secretKey` and `hmacKey` are required. On update, an **empty or missing** one (`StringUtils.isEmpty`) means "keep the stored one" (`resolveCredentials`); `publicKey` must always be sent.
- `credentials` is untyped on purpose — a generic `PaymentGatewayDTO<C, K>` can't deserialize, because `C` erases to a marker interface.
- Channel validation (`validateChannels`):
  - PAYMOB has `channelsRequired()`, so at least one channel is required ("At least one payment channel is required"). A provider without channel support rejects any channels.
  - Name required and ≤ 30 chars; names unique within the gateway (trimmed, case-insensitive).
  - Currency in `{EGP, USD}`; `providerConfig` required, provider-validated, and unique within the gateway.
- **`getActivePaymentGatewayForPayment()`** is the runtime read used by `PaymentService`. It returns **unmasked** credentials — never serialize it. It throws `BusinessException("Online payment is currently unavailable")` when nothing is active, or the active gateway has channels but none active.

## Soft delete

`deletePaymentGateway` sets `deletedAt` instead of removing the row, so bookings keep a valid FK and old transactions stay refundable. It refuses to delete an **active** gateway, or one with recent activity: `BookingRepository.existsActivityByGateway` counts `PENDING_PAYMENT` bookings, or `CONFIRMED`/`REFUNDED` ones updated within `SETTLED_BOOKING_RETENTION_DAYS` (14).

Every read excludes deleted rows — the `...DeletedAtIsNull` derived queries, and `findByUuidForUpdate` (pessimistic lock, used by update, status and delete), which filters `deletedAt IS NULL` in JPQL, so editing a deleted gateway 404s. **The exception is `findByUuid`**, used by `getPaymentGatewayForPayment(uuid)`. It deliberately returns deleted gateways so `PaymentService.resolveGateway` can still settle or refund transactions taken before the deletion. Don't "fix" it.

## Activation

`updatePaymentGatewayStatus` relies on the `UK_PAYMENT_GATEWAYS_ACTIVE` partial index ([manual-migrations.md](manual-migrations.md)). It deactivates the incumbent with `saveAndFlush` first, then wraps the activation in `catch (DataIntegrityViolationException)` → `ConflictException` (409). That catch is load-bearing: the row lock only serializes activations of the **same** gateway, so two admins activating **different** gateways still collide on the index.
