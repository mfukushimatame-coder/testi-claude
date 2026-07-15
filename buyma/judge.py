"""ルールベース判定ロジック: listings の蓄積データから「買いか」を機械的に判定する"""
from dataclasses import dataclass, field

from db import get_conn


@dataclass
class Judgment:
    product_id: int
    brand: str
    category: str
    item_name: str
    model_code: str | None
    verdict: str            # ◎ 買い候補 / ○ 検討 / △ 様子見 / ✕ 見送り
    verdict_label: str
    score: int
    reasons: list[str] = field(default_factory=list)
    avg_price: int | None = None
    recent_avg_price: int | None = None
    avg_discount: float | None = None
    category_avg_discount: float | None = None
    seller_count: int = 0
    max_review_count: int = 0
    observation_count: int = 0
    tags: list[str] = field(default_factory=list)
    cost_jpy: int | None = None
    profit: int | None = None
    profit_rate: float | None = None


def judge_product(product_id: int) -> Judgment | None:
    with get_conn() as conn:
        p = conn.execute(
            "SELECT * FROM products WHERE product_id = ?", (product_id,)
        ).fetchone()
        if not p:
            return None

        rows = conn.execute(
            "SELECT * FROM listings WHERE product_id = ? ORDER BY observed_date",
            (product_id,),
        ).fetchall()

        j = Judgment(
            product_id=product_id,
            brand=p["brand"] or "",
            category=p["category"] or "",
            item_name=p["item_name"] or "",
            model_code=p["model_code"],
            verdict="△",
            verdict_label="様子見",
            score=0,
        )
        if not rows:
            j.reasons.append("観測データがありません")
            return j

        j.observation_count = len(rows)
        prices = [r["price"] for r in rows if r["price"]]
        discounts = [r["discount_rate"] for r in rows if r["discount_rate"] is not None]
        j.avg_price = round(sum(prices) / len(prices)) if prices else None
        recent = prices[-3:]
        j.recent_avg_price = round(sum(recent) / len(recent)) if recent else None
        j.avg_discount = round(sum(discounts) / len(discounts), 1) if discounts else None
        j.seller_count = len({r["seller_name"] for r in rows if r["seller_name"]})
        j.max_review_count = max((r["review_count"] or 0) for r in rows)

        tags = set()
        for r in rows:
            if r["no_tariff_flag"]:
                tags.add("関税負担なし")
            if r["speed_shipping_flag"]:
                tags.add("スピード配送")
            if r["tags"]:
                tags.update(t.strip() for t in r["tags"].split(",") if t.strip())
        j.tags = sorted(tags)

        # --- カテゴリ平均割引率（自商品の観測は除外して比較する） ---
        cat_row = conn.execute(
            "SELECT AVG(l.discount_rate) AS avg_d FROM listings l "
            "JOIN products pr ON pr.product_id = l.product_id "
            "WHERE pr.category = ? AND l.discount_rate IS NOT NULL "
            "AND l.product_id != ?",
            (p["category"], product_id),
        ).fetchone()
        if cat_row and cat_row["avg_d"] is not None:
            j.category_avg_discount = round(cat_row["avg_d"], 1)
        else:
            # 同カテゴリに他商品がない場合は全体平均で代用
            all_row = conn.execute(
                "SELECT AVG(discount_rate) AS avg_d FROM listings "
                "WHERE discount_rate IS NOT NULL AND product_id != ?",
                (product_id,),
            ).fetchone()
            j.category_avg_discount = (
                round(all_row["avg_d"], 1)
                if all_row and all_row["avg_d"] is not None
                else None
            )

        score = 0

        # 1. 平均割引率（同カテゴリ平均比）
        if j.avg_discount is not None and j.category_avg_discount is not None:
            if j.avg_discount > j.category_avg_discount:
                score += 2
                j.reasons.append(
                    f"平均割引率{j.avg_discount}%はカテゴリ平均({j.category_avg_discount}%)より高い → 加点"
                )
            else:
                j.reasons.append(
                    f"平均割引率{j.avg_discount}%はカテゴリ平均({j.category_avg_discount}%)以下"
                )

        # 2. 評価数
        if j.max_review_count >= 10:
            score += 2
            j.reasons.append(f"評価{j.max_review_count}件あり → 実績十分で加点")
        elif j.max_review_count > 0:
            score += 1
            j.reasons.append(f"評価{j.max_review_count}件（10件未満）→ 小幅加点")
        else:
            score -= 1
            j.reasons.append("評価データなし（実績不明点として留意）→ 減点")

        # 3. 出品者数
        if j.seller_count >= 2:
            score += 2
            j.reasons.append(
                f"{j.seller_count}名の異なる出品者が出品 → 需要が安定している証拠で加点"
            )
        elif j.seller_count == 1:
            j.reasons.append("出品者は1名のみ")

        # 4. 価格の時系列推移（直近 vs 全体）
        if j.avg_price and j.recent_avg_price and len(prices) >= 4:
            change = (j.recent_avg_price - j.avg_price) / j.avg_price
            if change <= -0.07:
                score -= 2
                j.reasons.append(
                    f"直近平均¥{j.recent_avg_price:,}は全体平均¥{j.avg_price:,}より値下がり傾向（人気低下の可能性）→ 減点"
                )
            elif change >= -0.02:
                score += 1
                j.reasons.append("価格は高値安定 → 加点")

        # 5. タグ（参考表示）
        if j.tags:
            j.reasons.append(f"付帯情報: {', '.join(j.tags)}（購入率に影響する参考情報）")

        j.score = score
        if score >= 4:
            j.verdict, j.verdict_label = "◎", "買い候補"
        elif score >= 2:
            j.verdict, j.verdict_label = "○", "検討"
        elif score >= 0:
            j.verdict, j.verdict_label = "△", "様子見"
        else:
            j.verdict, j.verdict_label = "✕", "見送り"

        # --- 原価・見込み利益 ---
        cost = conn.execute(
            "SELECT AVG(purchase_price_jpy) AS c, AVG(COALESCE(vat_refund_expected,0)) AS v "
            "FROM purchases WHERE product_id = ? AND purchase_price_jpy IS NOT NULL",
            (product_id,),
        ).fetchone()
        if cost and cost["c"]:
            j.cost_jpy = round(cost["c"] - (cost["v"] or 0))
            base = j.recent_avg_price or j.avg_price
            if base:
                # BUYMA成約手数料(概算7.7%)を差し引いて試算
                net = round(base * 0.923)
                j.profit = net - j.cost_jpy
                j.profit_rate = round(j.profit / base * 100, 1)

        return j


def judgment_to_dict(j: Judgment) -> dict:
    return {
        "product_id": j.product_id,
        "brand": j.brand,
        "category": j.category,
        "item_name": j.item_name,
        "model_code": j.model_code,
        "verdict": j.verdict,
        "verdict_label": j.verdict_label,
        "score": j.score,
        "reasons": j.reasons,
        "avg_price": j.avg_price,
        "recent_avg_price": j.recent_avg_price,
        "avg_discount": j.avg_discount,
        "category_avg_discount": j.category_avg_discount,
        "seller_count": j.seller_count,
        "max_review_count": j.max_review_count,
        "observation_count": j.observation_count,
        "tags": j.tags,
        "cost_jpy": j.cost_jpy,
        "profit": j.profit,
        "profit_rate": j.profit_rate,
    }
