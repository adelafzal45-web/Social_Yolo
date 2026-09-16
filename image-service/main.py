from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import Response
from pydantic import BaseModel

import clip_encoder
from image_processor import process_image


app = FastAPI()

print("in main")
@app.get("/")
def root():
    return {
        "message": "Image processing service is running"
    }


@app.post("/process-image")
async def process_image_endpoint(
    file: UploadFile = File(...)
):

    image_bytes = await file.read()

    processed_image = process_image(image_bytes)

    return Response(
        content=processed_image,
        media_type="image/png"
    )


# ---------------------------------------------------------------------------
# CLIP embeddings (RAG image-style pool)
# ---------------------------------------------------------------------------

class EmbedTextRequest(BaseModel):
    """One prompt to embed with the CLIP text encoder."""
    text: str


@app.get("/embedding-health")
def embedding_health():
    """Reports the CLIP model, its load state and embedding dimensions."""
    return clip_encoder.model_info()


@app.post("/embed-image")
async def embed_image_endpoint(file: UploadFile = File(...)):
    """Embeds an uploaded image into the CLIP vector space (512 dims)."""
    image_bytes = await file.read()
    try:
        embedding = clip_encoder.embed_image_bytes(image_bytes)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:  # noqa: BLE001 - decode/encode failures
        raise HTTPException(status_code=400, detail=f"Failed to embed image: {exc}")
    return {
        "embedding": embedding,
        "dimensions": len(embedding),
        "model": clip_encoder.MODEL_NAME,
    }


@app.post("/embed-text")
def embed_text_endpoint(request: EmbedTextRequest):
    """Embeds a text prompt with the CLIP text encoder (same space as /embed-image)."""
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text must not be empty")
    try:
        embedding = clip_encoder.embed_texts([text])[0]
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return {
        "embedding": embedding,
        "dimensions": len(embedding),
        "model": clip_encoder.MODEL_NAME,
    }


# Allows starting the server directly with:  python main.py
# (equivalent to: uvicorn main:app --host 0.0.0.0 --port 8000)
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

