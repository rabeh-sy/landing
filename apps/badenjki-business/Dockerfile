FROM node:24.22.3-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG PUBLIC_BADENJKI_API_ORIGIN=https://r-lite.rabeh.sy
RUN npm run build
RUN set -e; \
    mkdir -p /app/private/ar /app/private/en; \
    mv dist/pricing /app/private/; \
    mv dist/ar/pricing /app/private/ar/; \
    mv dist/en/pricing /app/private/en/

FROM nginx:stable-alpine

ENV BADENJKI_PRICING_ORIGIN_TOKEN="" \
    NGINX_ENVSUBST_FILTER="^BADENJKI_PRICING_ORIGIN_TOKEN$"
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/ /usr/share/nginx/html/
COPY --from=build /app/private/ /usr/share/nginx/private/

EXPOSE 80
