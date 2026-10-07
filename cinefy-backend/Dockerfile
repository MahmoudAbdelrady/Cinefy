# ============================ Build stage ============================
FROM eclipse-temurin:25-jdk-alpine-3.24 AS build

RUN apk add --no-cache maven

WORKDIR /build

COPY pom.xml ./
RUN mvn -B dependency:go-offline

COPY lombok.config ./
COPY src ./src
RUN mvn -B clean package -DskipTests

# ============================ Run stage ==============================
FROM eclipse-temurin:25-jre-alpine-3.24 AS run

ARG APK_CACHE_BUST

RUN apk upgrade --no-cache \
    && addgroup -S -g 1001 cinefy \
    && adduser -S -u 1001 -G cinefy -H -D cinefy-app

WORKDIR /app

COPY --from=build --chown=cinefy-app:cinefy /build/target/cinefy-*.jar app.jar

USER cinefy-app:cinefy

ENTRYPOINT ["java", "-jar", "app.jar"]
