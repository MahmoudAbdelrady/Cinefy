# Scheduled jobs and logging aspects

## Jobs

`@EnableScheduling` and `@EnableAsync` are on `CinefyApplication`. Jobs live in `job/`:

| Job                    | Cron                         | What it does                                                                                                                                                                                                                                                                                                                       |
| ---------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ShowtimeStatusJob`    | `0 * * * * *` (every minute) | `ShowtimeRepository.markRunningAsOf(now)` / `markFinishedAsOf(now)` advance `Showtime.status` from start/end times. When any showtime finished, `hallRepository.flipIdleScheduledHallsToActive(LIVE_STATUSES)` turns `SCHEDULED` halls with no live showtimes back to `ACTIVE`                                                     |
| `BookingCleanupJob`    | `0 * * * * *`                | `BookingService.deleteExpiredPendingBatch(cutOffDate, batchSize)` hard-deletes expired holds (including `PENDING_PAYMENT`) in batches of 200                                                                                                                                                                                       |
| `TmdbSyncJob`          | `0 0 3 * * *` (daily 03:00)  | 1. `demoteIneligibleHighlighted()` un-highlights movies with no committed showtimes, unless announced and unreleased. 2. Deletes movies no showtime references, sparing announced movies whose release date is still ahead. 3. Refreshes the rest from TMDB in batches of 50; movies TMDB now 404s are deleted (`refreshOrDelete`) |
| `InvalidJwtCleanupJob` | `0 0 3 * * *`                | Prunes expired blocklisted JWTs, in batches of 100                                                                                                                                                                                                                                                                                 |

A new job goes in `job/` as a `@Component` with `@Slf4j` + `@Scheduled`, and gets repositories/services through `@RequiredArgsConstructor`.

## Logging aspects

- `RequestLoggingAspect` — pointcut `within(@RestController *)`; logs `(METHOD) Request URI: ...` around every controller call.
- `TransactionLoggingAspect` — pointcut `@annotation(...Transactional)`; logs around every `@Transactional` invocation.

Both delegate to `LoggingUtil.proceedWithLogging(...)`. Don't add ad-hoc `log.info(...)` at controller or transaction entry points — the aspects already cover them.
