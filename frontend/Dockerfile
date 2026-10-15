# Stage 1: Build React/Vite production bundle
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Lightweight, non-root production Nginx server
FROM nginxinc/nginx-unprivileged:alpine

# Copy built production assets
COPY --from=build --chown=101:101 /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

USER 101

CMD ["nginx", "-g", "daemon off;"]
