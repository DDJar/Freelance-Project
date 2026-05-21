# Build stage
FROM node:18 AS build

WORKDIR /app

COPY package*.json ./
COPY packages ./packages

RUN npm install

WORKDIR /app/packages/react
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/packages/react/build /usr/share/nginx/html

# Copy file cấu hình nginx.conf vào thư mục config mặc định của nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
