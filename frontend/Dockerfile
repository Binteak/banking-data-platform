FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# Versiones del package-lock y sin scripts de instalación de terceros
RUN npm ci --ignore-scripts --legacy-peer-deps
COPY angular.json tsconfig*.json ./
COPY public ./public
COPY src ./src
RUN npm run build -- --configuration docker

# nginx sin privilegios de root (escucha en el puerto 8080)
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 8080
