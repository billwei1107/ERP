# 問題追蹤日誌 (Troubleshooting Log)

## 2026-01-15 Backen Startup Failure & ID Collision

### 1. 502 Bad Gateway / Database Migration Failure
- **問題描述 (Issue)**: 
  - 後端服務啟動失敗，Nginx 回傳 502。
  - 原因：`prisma db push` 失敗。因為原本資料庫已有資料，但新 Schema 強制要求 `empId` 且無預設值（或是預設值無法填入舊資料），導致遷移失敗。
- **解決方案 (Solution)**:
  - 修改 `schema.prisma`，暫時將 `empId` 設為 `String?` (Optional)。
  - 在 `UsersService.onModuleInit` 加入邏輯：啟動時檢查並自動為 `empId` 為空的舊用戶補上 `EMPxxx` 編號。

### 2. Employee ID Generation Collision (EMP101 Conflict)
- **問題描述 (Issue)**:
  - 新增員工時不斷出現 `409 Conflict` (或是之前的 500/401)。
  - 原因：ID 產生邏輯 `findFirst({ orderBy: { id: 'desc' } })` 一直抓到 ID 為 100 的 Admin 使用者，導致系統一直試圖建立 `EMP101`，與既有資料衝突。
- **解決方案 (Solution)**:
  - 重構 `create` 方法為「兩段式建立」：
    1. 先 `prisma.user.create()` (讓資料庫處理 ID 自增)。
    2. 取得新 ID 後，再 `prisma.user.update()` 將 `empId` 更新為 `EMP` + ID (例如 `EMP012` for ID 12)。
  - 此法可確保 `empId` 與真實 ID 連動且絕對唯一。
