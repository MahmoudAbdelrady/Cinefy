FROM nginx:1.31.6-alpine3.24

COPY nginx.prod.conf /etc/nginx/conf.d/default.conf
