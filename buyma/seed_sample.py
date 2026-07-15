"""動作確認用サンプルデータ投入スクリプト（2026/6/21 PRADA財布・小物の分析を模したダミーデータ）

実際の録画動画(mp4)が手元にある場合はこのスクリプトは不要です。
Webアプリの「動画アップロード」から投入してください。

使い方: python seed_sample.py
"""
from analyzer import dedupe_and_store
from db import init_db

SAMPLE_LISTINGS = [
    # PRADA 三角ロゴ キーホルダー（複数出品者・高割引 → 買い候補になる想定）
    {"brand": "PRADA", "category": "キーホルダー", "item_name": "三角ロゴ キーホルダー サフィアーノ ブラック",
     "model_code": "2PP301", "price": 38000, "discount_rate": 32.0, "list_price": 55900,
     "review_count": 0, "seller_name": "MilanoStyle", "seller_rank": "PREMIUM PERSONAL SHOPPER",
     "no_tariff": True, "speed_shipping": False, "tags": []},
    {"brand": "PRADA", "category": "キーホルダー", "item_name": "三角ロゴ キーホルダー サフィアーノ ブラック",
     "model_code": "2PP301", "price": 37500, "discount_rate": 33.0, "list_price": 55900,
     "review_count": 0, "seller_name": "ParisSelect", "seller_rank": "PERSONAL SHOPPER",
     "no_tariff": True, "speed_shipping": True, "tags": ["タイムセール"]},

    # PRADA サフィアーノ 長財布（評価多数・安定 → 検討〜買い候補）
    {"brand": "PRADA", "category": "財布", "item_name": "サフィアーノ 長財布 ゴールドロゴ ブラック",
     "model_code": "1ML506", "price": 128000, "discount_rate": 18.0, "list_price": 156000,
     "review_count": 24, "seller_name": "MilanoStyle", "seller_rank": "PREMIUM PERSONAL SHOPPER",
     "no_tariff": True, "speed_shipping": False, "tags": []},
    {"brand": "PRADA", "category": "財布", "item_name": "サフィアーノ 長財布 ゴールドロゴ ブラック",
     "model_code": "1ML506", "price": 125800, "discount_rate": 19.0, "list_price": 156000,
     "review_count": 11, "seller_name": "TokyoImport", "seller_rank": "PERSONAL SHOPPER",
     "no_tariff": False, "speed_shipping": True, "tags": []},

    # PRADA カードケース（出品者1名・評価なし・割引低め → 様子見）
    {"brand": "PRADA", "category": "カードケース", "item_name": "サフィアーノ カードケース ブルー",
     "model_code": None, "price": 52000, "discount_rate": 8.0, "list_price": 56500,
     "review_count": 0, "seller_name": "EuroBridge", "seller_rank": "PERSONAL SHOPPER",
     "no_tariff": False, "speed_shipping": False, "tags": []},

    # PRADA コインケース（値下がり傾向を作るため複数観測）
    {"brand": "PRADA", "category": "コインケース", "item_name": "サフィアーノ コインケース ブラック",
     "model_code": "2MM003", "price": 46000, "discount_rate": 12.0, "list_price": 52300,
     "review_count": 5, "seller_name": "MilanoStyle", "seller_rank": "PREMIUM PERSONAL SHOPPER",
     "no_tariff": True, "speed_shipping": False, "tags": []},
]

# 過去観測（値下がり傾向の履歴を模す）
HISTORY = [
    ("2026-06-07", {"brand": "PRADA", "category": "コインケース",
                    "item_name": "サフィアーノ コインケース ブラック", "model_code": "2MM003",
                    "price": 49800, "discount_rate": 6.0, "list_price": 53000, "review_count": 4,
                    "seller_name": "MilanoStyle", "seller_rank": "PREMIUM PERSONAL SHOPPER",
                    "no_tariff": True, "speed_shipping": False, "tags": []}),
    ("2026-06-14", {"brand": "PRADA", "category": "コインケース",
                    "item_name": "サフィアーノ コインケース ブラック", "model_code": "2MM003",
                    "price": 48200, "discount_rate": 9.0, "list_price": 53000, "review_count": 4,
                    "seller_name": "MilanoStyle", "seller_rank": "PREMIUM PERSONAL SHOPPER",
                    "no_tariff": True, "speed_shipping": False, "tags": []}),
    ("2026-06-14", {"brand": "PRADA", "category": "財布",
                    "item_name": "サフィアーノ 長財布 ゴールドロゴ ブラック", "model_code": "1ML506",
                    "price": 127500, "discount_rate": 18.0, "list_price": 156000, "review_count": 18,
                    "seller_name": "MilanoStyle", "seller_rank": "PREMIUM PERSONAL SHOPPER",
                    "no_tariff": True, "speed_shipping": False, "tags": []}),
    ("2026-06-14", {"brand": "PRADA", "category": "キーホルダー",
                    "item_name": "三角ロゴ キーホルダー サフィアーノ ブラック", "model_code": "2PP301",
                    "price": 38500, "discount_rate": 31.0, "list_price": 55900, "review_count": 0,
                    "seller_name": "MilanoStyle", "seller_rank": "PREMIUM PERSONAL SHOPPER",
                    "no_tariff": True, "speed_shipping": False, "tags": []}),
]


def main():
    init_db()
    total_l, total_p = 0, 0
    for observed, item in HISTORY:
        a, p = dedupe_and_store([item], "sample_history", observed_date=observed)
        total_l += a
        total_p += p
    a, p = dedupe_and_store(SAMPLE_LISTINGS, "sample_2026-06-21.mp4", observed_date="2026-06-21")
    total_l += a
    total_p += p
    print(f"サンプルデータを投入しました: listing {total_l}件 / 新規商品 {total_p}件")
    print("python app.py でサーバーを起動し、ブラウザで検索を試してください。")


if __name__ == "__main__":
    main()
