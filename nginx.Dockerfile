FROM nginx:1.31.6-alpine3.24-slim

ARG APK_CACHE_BUST

RUN apk upgrade --no-cache \
    && addgroup -S -g 1001 cinefy \
    && adduser -S -u 1001 -G cinefy -H -D cinefy-app \
    && sed -i -e '/^user /d' -e 's|^pid .*|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf \
    && chown -R cinefy-app:cinefy /var/cache/nginx

USER cinefy-app:cinefy
