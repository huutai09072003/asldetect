from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import base64
import numpy as np
import cv2
from ultralytics import YOLO

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("best.pt")

@app.websocket("/ws/stream")
async def ws_stream(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            base64_data = await websocket.receive_text()
            image_data = base64.b64decode(base64_data)
            img = Image.open(io.BytesIO(image_data)).convert("RGB")
            img_np = np.array(img)

            # Predict
            results = model(img_np)[0]
            annotated = results.plot()  # numpy array (BGR)

            # Encode to JPEG + base64
            _, buffer = cv2.imencode(".jpg", annotated)
            base64_result = base64.b64encode(buffer).decode("utf-8")
            await websocket.send_text(base64_result)
    except Exception as e:
        print("WebSocket error:", e)
