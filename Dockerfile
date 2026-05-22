# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
# Use ci instead of install for reliable, faster builds
RUN npm ci 
COPY . .

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/iot-frontend/browser /usr/share/nginx/html
EXPOSE 80