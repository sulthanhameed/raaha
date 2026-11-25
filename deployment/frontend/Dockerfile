# Build from the repository root, e.g. docker build -f deployment/frontend/Dockerfile .
FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/index.html frontend/vite.config.ts frontend/tsconfig.json ./
COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/scripts/check-cutouts.mjs frontend/scripts/check-table-scenes.mjs ./scripts/
# These build arguments are PUBLIC. Never pass service-role or payment secrets.
ARG VITE_API_BASE_URL=""
ARG VITE_SUPABASE_PUBLISHABLE_KEY=""
ARG VITE_TURNSTILE_SITE_KEY=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY
RUN npm run build

FROM nginx:1.27-alpine
COPY deployment/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
