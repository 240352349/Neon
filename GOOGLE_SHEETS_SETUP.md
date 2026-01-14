# Google Sheets 產品數據結構建議

## 推薦的 Google Sheets 結構

為了方便網頁讀取和顯示產品數據，建議使用以下欄位結構：

### 基本產品信息表（Sheet 1: "Products"）

| ID | Name | Price | Image1 | Image2 | Image3 | Description | Details | Category | Stock | Status |
|----|------|-------|--------|--------|--------|-------------|---------|----------|-------|--------|
| 1 | Official Light Stick Keyring | 348 | LE_SSERAFIM/Official Light Stick Keyring.jpg | | | 官方應援棒鑰匙圈 | 尺寸：... | Keyring | 50 | Active |
| 2 | FIM'S CLUB Photo Card Holder | 348 | LE_SSERAFIM/FIM'S CLUB Photo Card Holder.jpg | | | FIM'S CLUB 小卡收納冊 | 可收納... | Accessory | 30 | Active |

### 欄位說明：

1. **ID** (必填)
   - 產品唯一識別碼
   - 數字類型
   - 建議從1開始遞增

2. **Name** (必填)
   - 產品名稱
   - 文字類型
   - 會顯示在產品卡片和詳情頁

3. **Price** (必填)
   - 產品價格（港幣）
   - 數字類型
   - 不包含貨幣符號

4. **Image1, Image2, Image3** (Image1必填)
   - 產品圖片路徑
   - 文字類型
   - 格式：`LE_SSERAFIM/產品名稱.jpg`
   - 如果有多張圖片，依序填入 Image2, Image3
   - 第一張圖片會作為主圖顯示

5. **Description** (選填)
   - 產品簡短描述
   - 文字類型
   - 會顯示在產品詳情頁

6. **Details** (選填)
   - 產品詳細資料
   - 文字類型
   - 可包含多行文字
   - 會顯示在產品詳情頁

7. **Category** (選填)
   - 產品分類
   - 文字類型
   - 例如：Keyring, Accessory, Clothing 等
   - 可用於產品篩選

8. **Stock** (選填)
   - 庫存數量
   - 數字類型
   - 可用於庫存管理

9. **Status** (選填)
   - 產品狀態
   - 文字類型
   - 建議值：Active（上架）、Inactive（下架）、Sold Out（售完）
   - 可用於控制產品是否顯示

## 範例數據

```
ID | Name | Price | Image1 | Description | Details
1  | Official Light Stick Keyring | 348 | LE_SSERAFIM/Official Light Stick Keyring.jpg | 官方應援棒鑰匙圈 | 尺寸：約 5cm x 3cm\n材質：ABS塑料\n包裝：獨立包裝
```

## 注意事項

1. **第一行必須是標題行**（欄位名稱）
2. **ID 必須唯一**，不能重複
3. **圖片路徑**必須與實際文件夾結構一致
4. **價格**只填數字，不要包含貨幣符號
5. **多行文字**在 Details 欄位中可用 `\n` 表示換行
6. **空欄位**可以留空，但必填欄位（ID, Name, Price, Image1）必須有值

## 如何設置 Google Sheets 為公開

1. 打開您的 Google Sheets
2. 點擊右上角的「共用」按鈕
3. 將權限設為「知道連結的任何人」
4. 選擇「檢視者」權限
5. 複製連結

## 網頁讀取方式

網頁會使用以下格式讀取數據：
```
https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json
```

其中 `{SHEET_ID}` 是您 Google Sheets 的 ID（在網址中可以找到）

## 建議的數據組織方式

### 方式一：單一表格（推薦）
- 所有產品放在一個表格中
- 使用 Status 欄位控制顯示
- 簡單易管理

### 方式二：多個表格
- 按分類分開不同表格
- 例如：Sheet1 = "Keyrings", Sheet2 = "Accessories"
- 需要分別讀取每個表格

## 數據更新流程

1. 在 Google Sheets 中更新產品信息
2. 網頁會自動從 Google Sheets 讀取最新數據
3. 數據會緩存24小時，之後自動更新
4. 如需立即更新，可清除瀏覽器緩存

