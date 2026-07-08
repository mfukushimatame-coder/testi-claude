"""BUYMAせどり目利き判定システム - Webサーバー
PC上で起動し、同一Wi-Fi内のスマホ/PCブラウザからアクセスする。
起動: python app.py  (または uvicorn app:app --host 0.0.0.0 --port 8000)
"""
import shutil
import socket
import threading
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from db import get_conn, init_db
from judge import judge_product, judgment_to_dict

BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "data" / "uploads"

app = FastAPI(title="BUYMA目利き判定システム")
init_db()


# ---------- 動画アップロード ----------

@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    dest = UPLOAD_DIR / file.filename
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO jobs (filename, status) VALUES (?, 'processing')",
            (file.filename,),
        )
        job_id = cur.lastrowid

    threading.Thread(
        target=_run_job, args=(job_id, str(dest), file.filename), daemon=True
    ).start()
    return {"job_id": job_id}


def _run_job(job_id: int, video_path: str, filename: str):
    from analyzer import process_video  # 遅延import（anthropic未導入でも検索機能は動く）
    try:
        added, new_products = process_video(video_path, filename)
        with get_conn() as conn:
            conn.execute(
                "UPDATE jobs SET status='done', listings_added=?, products_added=?, "
                "message=? WHERE job_id=?",
                (added, new_products, f"{added}件のデータを追加しました（新規商品{new_products}件）", job_id),
            )
    except Exception as e:  # ジョブ失敗はDBに記録してUIに表示する
        with get_conn() as conn:
            conn.execute(
                "UPDATE jobs SET status='error', message=? WHERE job_id=?",
                (str(e), job_id),
            )


@app.get("/api/jobs/{job_id}")
def get_job(job_id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM jobs WHERE job_id=?", (job_id,)).fetchone()
    if not row:
        raise HTTPException(404, "job not found")
    return dict(row)


# ---------- 検索・判定 ----------

@app.get("/api/search")
def search(q: str = ""):
    like = f"%{q}%"
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT product_id FROM products "
            "WHERE item_name LIKE ? OR model_code LIKE ? OR brand LIKE ? OR category LIKE ? "
            "ORDER BY product_id DESC LIMIT 50",
            (like, like, like, like),
        ).fetchall()
    results = []
    for r in rows:
        j = judge_product(r["product_id"])
        if j:
            results.append(judgment_to_dict(j))
    # スコア降順で表示
    results.sort(key=lambda x: x["score"], reverse=True)
    return {"results": results}


@app.get("/api/products")
def list_products():
    """原価入力フォームの商品選択用"""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT product_id, brand, category, item_name, model_code "
            "FROM products ORDER BY brand, category, item_name"
        ).fetchall()
    return {"products": [dict(r) for r in rows]}


# ---------- 原価入力 ----------

@app.post("/api/purchases")
def add_purchase(
    product_id: int = Form(...),
    purchase_date: str = Form(...),
    purchase_price_local: float = Form(...),
    currency: str = Form("EUR"),
    exchange_rate: float = Form(...),
    store_name: str = Form(""),
    city: str = Form(""),
    vat_refund_expected: int = Form(0),
):
    price_jpy = round(purchase_price_local * exchange_rate)
    with get_conn() as conn:
        exists = conn.execute(
            "SELECT 1 FROM products WHERE product_id=?", (product_id,)
        ).fetchone()
        if not exists:
            raise HTTPException(404, "指定された商品が存在しません")
        conn.execute(
            "INSERT INTO purchases (product_id, purchase_date, purchase_price_local, "
            "currency, purchase_price_jpy, store_name, city, vat_refund_expected) "
            "VALUES (?,?,?,?,?,?,?,?)",
            (product_id, purchase_date, purchase_price_local, currency,
             price_jpy, store_name, city, vat_refund_expected),
        )
    return {"ok": True, "purchase_price_jpy": price_jpy}


@app.get("/api/purchases")
def list_purchases():
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT pu.*, p.brand, p.item_name FROM purchases pu "
            "JOIN products p ON p.product_id = pu.product_id "
            "ORDER BY pu.purchase_date DESC"
        ).fetchall()
    return {"purchases": [dict(r) for r in rows]}


# ---------- 静的ファイル ----------

@app.get("/")
def index():
    return FileResponse(BASE_DIR / "static" / "index.html")


app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")


def _local_ip() -> str:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


if __name__ == "__main__":
    import uvicorn

    ip = _local_ip()
    print("=" * 50)
    print("BUYMA目利き判定システムを起動します")
    print(f"  PCから:      http://localhost:8000")
    print(f"  スマホから:  http://{ip}:8000")
    print("  (スマホはPCと同じWi-Fiに接続してください)")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8000)
