# Face Motion Studio - データフォーマット仕様

## 概要

Face Motion Studioでは、作成したプロジェクトをJSON形式で保存・読み込みできます。このドキュメントでは、JSONデータの構造と各フィールドの詳細について説明します。

## データ形式の種類

### 1. 軽量版データ（`exportData()`）
パーツの位置やパラメータのみを保存。画像データは含まれません。

### 2. 完全版データ（`exportDataWithImages()`）
パーツの位置、パラメータ、画像データをすべて含む完全なデータ。

## JSON構造

```json
{
  "version": "1.1",
  "timestamp": "2024-12-26T10:30:00.000Z",
  "parts": [
    {
      "name": "ベース",
      "type": "base",
      "x": 350,
      "y": 350,
      "scale": 0.8,
      "baseScale": 0.8,
      "rotation": 0,
      "visible": true,
      "pivotX": 250,
      "pivotY": 250,
      "imageData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    }
  ],
  "params": {
    "blink": 0,
    "mouth": 0,
    "breath": 1,
    "leftBlink": 0,
    "rightBlink": 0,
    "angleX": 0,
    "angleY": 0,
    "angleZ": 0
  }
}
```

## フィールド詳細

### ルートオブジェクト

| フィールド | 型 | 必須 | 説明 |
|-----------|----|----|-----|
| `version` | string | ○ | データフォーマットのバージョン |
| `timestamp` | string | × | 保存日時（ISO 8601形式） |
| `parts` | array | ○ | パーツの配列 |
| `params` | object | ○ | 表情パラメータ |

### partsオブジェクト

| フィールド | 型 | 必須 | 説明 |
|-----------|----|----|-----|
| `name` | string | ○ | パーツ名 |
| `type` | string | ○ | パーツタイプ（詳細は後述） |
| `x` | number | ○ | X座標（ピクセル） |
| `y` | number | ○ | Y座標（ピクセル） |
| `scale` | number | ○ | 現在のスケール |
| `baseScale` | number | ○ | 基準スケール |
| `rotation` | number | ○ | 回転角度（度） |
| `visible` | boolean | ○ | 表示/非表示 |
| `pivotX` | number | ○ | X軸ピボット位置 |
| `pivotY` | number | ○ | Y軸ピボット位置 |
| `imageData` | string | × | Base64エンコードされた画像データ |

### パーツタイプ

| タイプ | 説明 |
|-------|-----|
| `base` | ベース（顔の土台） |
| `left_eye` | 左目 |
| `right_eye` | 右目 |
| `mouth` | 口 |
| `eyebrow` | 眉毛 |
| `hair` | 髪 |
| `other` | その他 |

### paramsオブジェクト

| フィールド | 型 | 範囲 | 説明 |
|-----------|----|----|-----|
| `blink` | number | 0.0-1.0 | 全体のまばたき度 |
| `mouth` | number | 0.0-1.0 | 口の開き度 |
| `breath` | number | 0.0-2.0 | 呼吸の深さ |
| `leftBlink` | number | 0.0-1.0 | 左目のまばたき度 |
| `rightBlink` | number | 0.0-1.0 | 右目のまばたき度 |
| `angleX` | number | -180-180 | 頭部ピッチ角度（上下） |
| `angleY` | number | -180-180 | 頭部ヨー角度（左右） |
| `angleZ` | number | -180-180 | 頭部ロール角度（傾き） |

## バージョン履歴

### v1.0（軽量版）
- 基本的なパーツ情報とパラメータ
- 画像データは含まない

### v1.1（完全版）
- v1.0の全機能
- Base64エンコードされた画像データを含む
- タイムスタンプ追加

## 使用例

### データの保存
```javascript
// 軽量版（画像なし）- data_export.js
exportData();

// 完全版（画像含む）- data_export.js
exportDataWithImages();

// 画像エクスポート - data_export.js
exportImage();
```

### データの読み込み
```javascript
// ファイル選択ダイアログから読み込み - data_import.js
importData();
```

## 注意事項

### ファイルサイズ
- **軽量版**: 通常数KB〜数十KB
- **完全版**: 画像の量により数MB〜数十MBになる可能性

### 互換性
- 新しいバージョンは古いバージョンのデータを読み込み可能
- 古いバージョンで新しいデータを読み込む場合、未知のフィールドは無視される

### 画像データ
- PNG形式でBase64エンコード
- 元の画像品質を保持
- ブラウザのメモリ制限に注意

## 開発者向け情報

### カスタムフィールドの追加
新しいフィールドを追加する場合：

1. **後方互換性を保つ**: 既存フィールドの削除や型変更は避ける
2. **デフォルト値を設定**: 新フィールドが存在しない場合の動作を定義
3. **バージョン番号を更新**: マイナーチェンジは小数点、メジャーチェンジは整数部分を変更

### ファイル構成と役割
- **data_export.js**: データ・画像エクスポート機能
  - `exportData()` - 軽量版データ保存
  - `exportDataWithImages()` - 完全版データ保存
  - `exportImage()` - 画像エクスポート

- **data_import.js**: データインポート機能
  - `importData()` - JSONファイル読み込み
  - `loadImportedData()` - データ復元処理
  - `restorePartsFromData()` - パーツ復元
  - `restoreParamsFromData()` - パラメータ復元

### 読み込み処理の流れ
1. JSONパース（data_import.js）
2. バージョンチェック
3. パーツデータ復元（画像の非同期読み込み）
4. パラメータ復元
5. UI更新（parts_manager.js）
6. アニメーション開始

### エラーハンドリング
- 不正なJSON形式
- 画像データの破損
- 必須フィールドの欠損
- バージョン非互換

これらのエラーは適切にキャッチし、ユーザーに分かりやすいメッセージを表示します。