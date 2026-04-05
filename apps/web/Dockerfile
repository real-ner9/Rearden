FROM node:20-slim AS build

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json turbo.json ./

# Copy packages
COPY packages/ packages/

# Copy web app
COPY apps/web/ apps/web/

# Install all dependencies
RUN npm install

# Build web (VITE_API_URL baked at build time)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npx turbo run build --filter=web

# Serve with nginx
FROM nginx:alpine

COPY --from=build /app/apps/web/dist /usr/share/nginx/html

# Nginx config for SPA + API proxy
RUN cat > /etc/nginx/conf.d/default.conf <<'NGINX'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://BACKEND_HOST:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws/ {
        proxy_pass http://BACKEND_HOST:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
NGINX

EXPOSE 80

CMD ["sh", "-c", "sed -i \"s|BACKEND_HOST|${BACKEND_HOST:-localhost}|g\" /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
