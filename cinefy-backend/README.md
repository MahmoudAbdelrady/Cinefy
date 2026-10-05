# Cinefy Backend

The REST API behind Cinefy. It handles bookings, payments, accounts, scheduling and reports for both the booking site and the staff dashboard.

For an overview of the project and its features, see the [main README](../README.md).

## Requirements

- **Java 25**
- **PostgreSQL**
- A [TMDB](https://www.themoviedb.org/settings/api) API read access token
- A Gmail account with an [app password](https://support.google.com/accounts/answer/185833)
- OAuth app credentials from [Google](https://console.cloud.google.com/apis/credentials) and [Microsoft](https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade), for customer social sign-in

## Configuration

Create an empty PostgreSQL database. The tables are created automatically on first start.

Then create `src/main/resources/application-local.yml` with your settings. The file is ignored by git, so your secrets stay local.

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/cinefy
    username: postgres
    password: postgres

springdoc:
  base-url: /docs
  swagger-ui:
    path: /docs/swagger-ui.html
  api-docs:
    path: /docs/api-docs

cinefy:
  mail:
    username: you@gmail.com
    password: your-gmail-app-password
  encryption:
    key: <random key> # generate with: openssl rand -base64 32
  admin: # the first admin account, created on start
    email: admin@example.com
    password: ChangeMe123!
  jwt:
    secret: <random key> # generate with: openssl rand -base64 32
    access-token-expiration: 900000
    refresh-token-expiration: 604800000
    refresh-token-rotation-threshold: 172800000
  otp:
    expiration-minutes: 10
  oauth:
    registration-token-expiration-minutes: 15
    google:
      client-id:
      client-secret:
    microsoft:
      client-id:
      client-secret:
    redirect-uri: /membership/oauth/callback
  cookie:
    secure: false
    same-site: Lax

app:
  base-url: ""
  frontend:
    mgmt:
      url: http://localhost:4201
    client:
      url: http://localhost:4200
  tmdb:
    access-token: <your TMDB token>
```

The `frontend` URLs must match where the two web apps run. The API only accepts browser requests from those addresses.

### Profiles

| Profile | Used for                                                                                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `local` | Development. Reads `application-local.yml`.                                                                                                                               |
| `prod`  | Production. Reads every setting from environment variables (see [`.env.example`](../.env.example) and [`application-prod.yml`](src/main/resources/application-prod.yml)). |

## Running

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

The API runs at **http://localhost:8080**.

Interactive API documentation (Swagger UI) is at **http://localhost:8080/docs/swagger-ui.html**.

To build a runnable JAR:

```bash
./mvnw clean package
```

## Project structure

All code lives under `src/main/java/com/mdevs/cinefy/`:

| Folder        | Contents                                                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `controller/` | REST endpoints, one controller per area: halls, movies, showtimes, bookings, staff, customers, payment gateways, statistics and authentication |
| `service/`    | Business logic                                                                                                                                 |
| `entity/`     | Database entities, with their enums under `entity/enums/`                                                                                      |
| `repository/` | Database queries                                                                                                                               |
| `dto/`        | Request and response objects, grouped by area                                                                                                  |
| `projection/` | Query result projections, grouped by area                                                                                                      |
| `job/`        | Scheduled jobs: updating showtime statuses, releasing expired seat holds, refreshing movie data from TMDB, cleanup                             |
| `config/`     | Application, security and database configuration                                                                                               |
| `filter/`     | Authentication and CSRF request filters                                                                                                        |
| `aspect/`     | Request and transaction logging                                                                                                                |
| `shared/`     | Code shared across areas: security, payment gateway client, OAuth clients, exceptions, validation, annotations, ticket QR codes                |
| `utils/`      | Small helpers: cookies, error responses, logging                                                                                               |

Email templates (verification codes and tickets) are in `src/main/resources/templates/`.
