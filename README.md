# Face Motion Studio

フェイストラッキングを使用した表情アニメーション作成ツール

## 機能

- リアルタイムフェイストラッキング
- 個別の左右まばたき検出
- 口の開閉検出
- 3D頭部姿勢推定（ピッチ、ヨー、ロール）
- パーツ管理とトランスフォーム制御
- レスポンシブデザイン（モバイル対応）
- 画像エクスポート機能

## Docker構築手順

### 前提条件
- Docker
- Docker Compose

### ローカル開発環境の構築

1. **リポジトリのクローン**
```bash
git clone <repository-url>
cd make_model
```

2. **Docker Composeでビルド・起動**
```bash
# ビルドと起動
docker-compose up --build

# バックグラウンドで起動
docker-compose up -d --build
```

3. **アクセス**
```
https://localhost:8443
```

### SSL証明書について
- 開発用の自己署名証明書が自動生成されます
- ブラウザで証明書の警告が表示された場合は「詳細設定」から「localhost にアクセスする (安全ではありません)」を選択してください

### 停止・削除
```bash
# 停止
docker-compose down

# イメージも削除
docker-compose down --rmi all
```

## デプロイ先情報

### 本番環境構成
- **サーバー**: HTTPS対応必須（MediaPipe Face Meshがカメラアクセスに必要）
- **ポート**: 8443（HTTPS）
- **SSL証明書**: 本番環境では正式なSSL証明書が必要

### 推奨デプロイ環境
- **Docker対応サーバー** (AWS ECS, Google Cloud Run, Azure Container Instancesなど)
- **静的サイトホスティング** (Netlify, Vercel, GitHub Pagesなど) ※HTTPS必須

### 環境変数
現在、特別な環境変数の設定は不要ですが、本番環境では以下を検討してください：
- SSL証明書のパス設定
- ドメイン設定

### カメラアクセスの注意事項
- フェイストラッキング機能はHTTPS環境でのみ動作します
- ローカル開発環境（localhost）ではHTTPでもカメラアクセス可能ですが、本番環境ではHTTPS必須

## 開発情報

### ディレクトリ構成
```
make_model/
├── src/                    # Webアプリケーションソース
│   ├── index.html         # メインHTML
│   ├── css/               # スタイルシート
│   │   └── style.css     # メインスタイル
│   └── js/                # JavaScript
│       ├── parts_manager.js   # パーツ管理・アニメーション
│       ├── face_tracking.js   # フェイストラッキング
│       ├── data_export.js     # データ・画像エクスポート
│       └── data_import.js     # データインポート
├── nginx/                 # Nginx設定
│   ├── default.conf      # Nginx設定ファイル
│   └── ssl/              # SSL証明書（自動生成）
├── Dockerfile             # Docker設定
├── docker-compose.yml     # Docker Compose設定
├── README.md             # このファイル
└── DATA_FORMAT.md        # JSON形式仕様書
```

### 技術スタック
- **フロントエンド**: HTML5 Canvas, JavaScript (ES6+)
- **フェイストラッキング**: MediaPipe Face Mesh
- **サーバー**: Nginx (Alpine Linux)
- **コンテナ**: Docker

### サンプル
URL：https://seiryu1996.github.io/make_model/