# Python の軽量ベースイメージを使用
FROM python:3.11-slim

# 作業ディレクトリを作成
WORKDIR /app

# 現在のディレクトリの内容をコンテナにコピー
COPY . .

# 必要なパッケージをインストール
RUN pip install --no-cache-dir -r requirements.txt

# Cloud Run はポート8080でリッスンする必要あり
EXPOSE 8080

# アプリケーションを起動
CMD ["python", "app.py"]
