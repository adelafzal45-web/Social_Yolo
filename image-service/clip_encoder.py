"""CLIP image/text embedding for the RAG image-style pool.

`clip-ViT-B-32` (sentence-transformers) embeds IMAGES and TEXT into one
shared vector space, which is what makes cross-modal retrieval possible:
a typed prompt ("Eid sale post") can be compared directly against the
embeddings of past post IMAGES. Text embeddings from Gemini live in a
DIFFERENT vector space and must never be mixed with these.

Model is configurable via the CLIP_MODEL env var (default
`clip-ViT-B-32`, 512 dims). Changing it invalidates every stored image
embedding — they record the producing model name and are filtered by it.
"""

import io
import os
import threading
from typing import List, Optional

from PIL import Image

MODEL_NAME = os.getenv("CLIP_MODEL", "clip-ViT-B-32")

# Large screenshots are downscaled before encoding. CLIP's own preprocess
# resizes to 224px anyway, so capping early just avoids pointless pixel work.
MAX_SIDE = 512

_lock = threading.Lock()
_model = None  # SentenceTransformer, loaded lazily on first use
_load_error: Optional[str] = None


def _load_model():
    """Loads the CLIP model once; caches a load error instead of crashing."""
    global _model, _load_error
    with _lock:
        if _model is not None or _load_error is not None:
            return
        try:
            from sentence_transformers import SentenceTransformer  # heavy import

            _model = SentenceTransformer(MODEL_NAME)
        except Exception as exc:  # noqa: BLE001 - report any load failure to the caller
            _load_error = f"{type(exc).__name__}: {exc}"


def model_info() -> dict:
    """Health payload: model name, load state and embedding dimensions."""
    loaded = _model is not None
    dimensions: Optional[int] = None
    if loaded:
        getter = getattr(_model, "get_embedding_dimension", None)
        if getter is None:  # sentence-transformers < 6
            getter = _model.get_sentence_embedding_dimension
        dimensions = int(getter())
    return {
        "model": MODEL_NAME,
        "loaded": loaded,
        "dimensions": dimensions,
        "error": _load_error,
    }


def _decode_image(data: bytes) -> Image.Image:
    image = Image.open(io.BytesIO(data))
    image = image.convert("RGB")
    image.thumbnail((MAX_SIDE, MAX_SIDE))
    return image


def embed_image_bytes(data: bytes) -> List[float]:
    """Embeds one image; raises RuntimeError with a clear message on failure."""
    _load_model()
    if _model is None:
        raise RuntimeError(
            f"CLIP model unavailable ({_load_error}). "
            "Install it with: pip install -r requirements.txt"
        )
    image = _decode_image(data)
    vector = _model.encode(
        [image],
        normalize_embeddings=True,  # unit length → cosine == dot product
        convert_to_numpy=True,
    )[0]
    return [float(x) for x in vector]


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Embeds texts with the CLIP text encoder (same space as images)."""
    _load_model()
    if _model is None:
        raise RuntimeError(
            f"CLIP model unavailable ({_load_error}). "
            "Install it with: pip install -r requirements.txt"
        )
    vectors = _model.encode(
        texts,
        normalize_embeddings=True,
        convert_to_numpy=True,
    )
    return [[float(x) for x in vector] for vector in vectors]
