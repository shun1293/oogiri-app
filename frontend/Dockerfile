# ビルド用ステージ
FROM node:20-alpine as build

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# 本番用ステージ
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# 必要に応じてポートとデフォルト設定
EXPOSE 8080

# Nginx のポートを 8080 に設定する
RUN sed -i 's/80;/8080;/g' /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
