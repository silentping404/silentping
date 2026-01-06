from fastapi import FastAPI, Request
from datetime import datetime

app = FastAPI()

@app.post("/webhook")
async def webhook(request: Request):
    payload = await request.json()

    print("---- Incoming Webhook ----")
    print("Time:", datetime.utcnow())
    print("Payload:", payload)
    print("--------------------------")

    return {"status": "received"}
