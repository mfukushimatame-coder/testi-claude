"""SQLite データベース層: スキーマ定義と接続ヘルパー"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "buyma.db"

SCHEMA = """
-- 商品マスタ（同一商品をまとめるための代表エンティティ）
CREATE TABLE IF NOT EXISTS products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT,
    category TEXT,           -- 例: 財布, カードケース, キーホルダー等
    item_name TEXT,          -- 認識できた商品名・特徴メモ
    model_code TEXT,         -- 型番（取得できれば）
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 出品観測ログ（動画を見るたびに増えていく時系列データ）
CREATE TABLE IF NOT EXISTS listings (
    listing_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER REFERENCES products(product_id),
    observed_date TEXT,      -- 記録日（分析日）
    seller_name TEXT,
    seller_rank TEXT,        -- PERSONAL SHOPPER / PREMIUM 等
    price INTEGER,           -- 送料込み価格
    discount_rate REAL,      -- 割引率(%)
    list_price INTEGER,      -- 元値
    review_count INTEGER,
    no_tariff_flag INTEGER DEFAULT 0,   -- 関税負担なし: 1/0
    speed_shipping_flag INTEGER DEFAULT 0,
    tags TEXT,               -- その他タグ（カンマ区切り）
    source_video TEXT        -- 元の動画ファイル名（トレーサビリティ用）
);

-- 現地買付原価（手動入力）
CREATE TABLE IF NOT EXISTS purchases (
    purchase_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER REFERENCES products(product_id),
    purchase_date TEXT,
    purchase_price_local REAL,   -- 現地通貨建て価格
    currency TEXT,               -- EUR等
    purchase_price_jpy INTEGER,  -- 円換算
    store_name TEXT,
    city TEXT,
    vat_refund_expected INTEGER, -- VAT還付見込み額(円)
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 動画処理ジョブ（アップロード→解析の進捗管理）
CREATE TABLE IF NOT EXISTS jobs (
    job_id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    status TEXT DEFAULT 'pending',  -- pending / processing / done / error
    message TEXT,
    listings_added INTEGER DEFAULT 0,
    products_added INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
"""


def get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with get_conn() as conn:
        conn.executescript(SCHEMA)


def find_or_create_product(
    conn: sqlite3.Connection,
    brand: str,
    category: str,
    item_name: str,
    model_code: str | None,
    price: int | None = None,
) -> tuple[int, bool]:
    """同一商品の近似マッチ。型番があればそれを優先キーにする。
    型番がない場合は ブランド+商品名の類似+価格帯(±15%) でマッチ。
    戻り値: (product_id, 新規作成したか)
    """
    if model_code:
        row = conn.execute(
            "SELECT product_id FROM products WHERE model_code = ? AND brand = ?",
            (model_code, brand),
        ).fetchone()
        if row:
            return row["product_id"], False

    # 型番なし: 名前の近似 + 価格帯マッチ
    candidates = conn.execute(
        "SELECT p.product_id, p.item_name, "
        "       (SELECT AVG(price) FROM listings l WHERE l.product_id = p.product_id) AS avg_price "
        "FROM products p WHERE p.brand = ? AND p.category = ?",
        (brand, category),
    ).fetchall()
    norm = _normalize(item_name)
    for c in candidates:
        if _similar(norm, _normalize(c["item_name"])):
            if price is None or c["avg_price"] is None:
                return c["product_id"], False
            if abs(price - c["avg_price"]) / max(c["avg_price"], 1) <= 0.15:
                return c["product_id"], False

    cur = conn.execute(
        "INSERT INTO products (brand, category, item_name, model_code) VALUES (?, ?, ?, ?)",
        (brand, category, item_name, model_code),
    )
    return cur.lastrowid, True


def _normalize(s: str) -> str:
    return "".join((s or "").lower().split())


def _similar(a: str, b: str) -> bool:
    """簡易類似判定: 片方がもう片方を含む、または文字集合の重なりが大きい"""
    if not a or not b:
        return False
    if a in b or b in a:
        return True
    sa, sb = set(a), set(b)
    inter = len(sa & sb)
    return inter / max(len(sa | sb), 1) >= 0.75
