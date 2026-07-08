"""動画解析パイプライン: ffmpegフレーム抽出 → Claude画像認識 → 重複排除 → SQLite保存"""
import base64
import json
import os
import subprocess
import tempfile
from datetime import date
from pathlib import Path

from anthropic import Anthropic

from db import get_conn, find_or_create_product

MODEL = "claude-opus-4-8"
FRAMES_PER_REQUEST = 3  # 1リクエストあたりのフレーム数

# 構造化出力スキーマ: 各フレームから抽出する出品情報
LISTING_SCHEMA = {
    "type": "object",
    "properties": {
        "listings": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "brand": {"type": "string", "description": "ブランド名 (例: PRADA, MARNI)"},
                    "category": {"type": "string", "description": "カテゴリ (例: 財布, カードケース, キーホルダー, キーケース, コインケース, ポーチ)"},
                    "item_name": {"type": "string", "description": "商品名または色・形状の特徴メモ"},
                    "model_code": {"type": ["string", "null"], "description": "型番が画面上で読み取れた場合のみ (例: 1ML018)。読み取れなければnull"},
                    "price": {"type": "integer", "description": "送料込み価格(円)。カンマや¥記号を除いた整数"},
                    "discount_rate": {"type": ["number", "null"], "description": "割引率(%)。表示がなければnull"},
                    "list_price": {"type": ["integer", "null"], "description": "元値(円)。表示がなければnull"},
                    "review_count": {"type": "integer", "description": "★の横の評価数。なければ0"},
                    "seller_name": {"type": ["string", "null"], "description": "出品者名"},
                    "seller_rank": {"type": ["string", "null"], "description": "出品者ランク (PERSONAL SHOPPER / PREMIUM PERSONAL SHOPPER等)"},
                    "no_tariff": {"type": "boolean", "description": "「関税負担なし」タグの有無"},
                    "speed_shipping": {"type": "boolean", "description": "「スピード配送」タグの有無"},
                    "tags": {"type": "array", "items": {"type": "string"}, "description": "その他のタグ (タイムセール等)"},
                },
                "required": [
                    "brand", "category", "item_name", "model_code", "price",
                    "discount_rate", "list_price", "review_count",
                    "seller_name", "seller_rank", "no_tariff", "speed_shipping", "tags",
                ],
                "additionalProperties": False,
            },
        }
    },
    "required": ["listings"],
    "additionalProperties": False,
}

EXTRACT_PROMPT = """これはBUYMA（バイマ）の検索結果一覧をスクロール録画した動画から抽出したフレーム画像です。

画像に写っている商品カード（出品）をすべて抽出してください。ルール:
- 価格・商品名が読み取れない不完全なカード（画面端で切れているもの）はスキップ
- 価格は送料込み表示の円価格を整数で
- 「XX%OFF」表示があれば discount_rate に数値を入れる
- ★マークの横の数字が評価数
- 複数フレームに同じ商品が写っている場合も、フレームごとに重複して出力してよい（後段で重複排除する）
- 型番（例: 1ML018, 2TT091 など英数字の品番）がカード上に見える場合のみ model_code に入れる"""


def extract_frames(video_path: str, out_dir: str, fps: float = 1.0) -> list[Path]:
    """ffmpegで一定間隔のフレームを抽出（幅800pxに縮小してトークン節約）"""
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg", "-y", "-i", video_path,
        "-vf", f"fps={fps},scale=800:-2",
        "-q:v", "4",
        str(out / "frame_%04d.jpg"),
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    return sorted(out.glob("frame_*.jpg"))


def analyze_frames(frames: list[Path], client: Anthropic) -> list[dict]:
    """フレームをバッチでClaudeに送り、出品情報を構造化抽出する"""
    all_listings: list[dict] = []
    for i in range(0, len(frames), FRAMES_PER_REQUEST):
        batch = frames[i : i + FRAMES_PER_REQUEST]
        content = []
        for f in batch:
            content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": base64.standard_b64encode(f.read_bytes()).decode(),
                },
            })
        content.append({"type": "text", "text": EXTRACT_PROMPT})

        response = client.messages.create(
            model=MODEL,
            max_tokens=16000,
            output_config={"format": {"type": "json_schema", "schema": LISTING_SCHEMA}},
            messages=[{"role": "user", "content": content}],
        )
        if response.stop_reason == "refusal":
            continue
        text = "".join(b.text for b in response.content if b.type == "text")
        try:
            data = json.loads(text)
            all_listings.extend(data.get("listings", []))
        except json.JSONDecodeError:
            continue
    return all_listings


def dedupe_and_store(
    listings: list[dict], source_video: str, observed_date: str | None = None
) -> tuple[int, int]:
    """重複排除してDBに保存。同一商品×同一出品者×同一価格は1観測にまとめる。
    戻り値: (追加したlisting数, 新規product数)
    """
    observed = observed_date or date.today().isoformat()
    added, new_products = 0, 0
    seen: set[tuple] = set()

    with get_conn() as conn:
        for item in listings:
            key = (
                item.get("brand"),
                (item.get("model_code") or item.get("item_name") or "").lower().replace(" ", ""),
                item.get("seller_name"),
                item.get("price"),
            )
            if key in seen:
                continue
            seen.add(key)

            product_id, created = find_or_create_product(
                conn,
                brand=item.get("brand") or "不明",
                category=item.get("category") or "小物",
                item_name=item.get("item_name") or "",
                model_code=item.get("model_code"),
                price=item.get("price"),
            )
            if created:
                new_products += 1

            # 同一観測日×同一出品者×同一価格が既にあればスキップ（履歴は上書きしない）
            dup = conn.execute(
                "SELECT 1 FROM listings WHERE product_id=? AND observed_date=? "
                "AND COALESCE(seller_name,'')=? AND price=?",
                (product_id, observed, item.get("seller_name") or "", item.get("price")),
            ).fetchone()
            if dup:
                continue

            list_price = item.get("list_price")
            if list_price is None and item.get("price") and item.get("discount_rate"):
                rate = item["discount_rate"] / 100
                if 0 < rate < 1:
                    list_price = round(item["price"] / (1 - rate))

            conn.execute(
                "INSERT INTO listings (product_id, observed_date, seller_name, seller_rank, "
                "price, discount_rate, list_price, review_count, no_tariff_flag, "
                "speed_shipping_flag, tags, source_video) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                (
                    product_id,
                    observed,
                    item.get("seller_name"),
                    item.get("seller_rank"),
                    item.get("price"),
                    item.get("discount_rate"),
                    list_price,
                    item.get("review_count") or 0,
                    1 if item.get("no_tariff") else 0,
                    1 if item.get("speed_shipping") else 0,
                    ",".join(item.get("tags") or []),
                    source_video,
                ),
            )
            added += 1
    return added, new_products


def process_video(video_path: str, source_name: str) -> tuple[int, int]:
    """動画1本のフルパイプライン。戻り値: (追加listing数, 新規product数)"""
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise RuntimeError(
            "ANTHROPIC_API_KEY が設定されていません。画像解析にはClaude APIキーが必要です。"
        )
    client = Anthropic()
    with tempfile.TemporaryDirectory() as tmp:
        frames = extract_frames(video_path, tmp)
        if not frames:
            raise RuntimeError("フレームを抽出できませんでした（動画形式を確認してください）")
        listings = analyze_frames(frames, client)
    return dedupe_and_store(listings, source_name)
