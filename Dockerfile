# Dockerfile
FROM nginx:alpine

# OpenSSLを使うためにインストール
RUN apk add --no-cache openssl

# HTML・nginx設定をコピー
COPY ./html /usr/share/nginx/html
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

# SSLディレクトリを作成して証明書を生成
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/key.pem \
    -out /etc/nginx/ssl/cert.pem \
    -subj "/C=JP/ST=Tokyo/L=Chiyoda/O=Dev/CN=localhost"
