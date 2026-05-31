# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci && test -x node_modules/.bin/ng
COPY . .
RUN npm run build && test -d dist/iot-frontend/browser

FROM nginx:alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/iot-frontend/browser /usr/share/nginx/html
EXPOSE 80