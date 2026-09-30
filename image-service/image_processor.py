"""Background removal and studio-grade enhancement for the image microservice.
Includes Redis / in-memory caching, solid core enhancement, de-fringing, and anti-aliasing.
"""

import io
import os
import gc
import hashlib
import threading
import logging
import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageOps, UnidentifiedImageError
from rembg import new_session, remove

logger = logging.getLogger("image_processor")

# Safe decompression limit (50 megapixels) to prevent decompression bombs
Image.MAX_IMAGE_PIXELS = 50_000_000

DEFAULT_MODEL = os.getenv("IMAGE_SERVICE_MODEL", "isnet-general-use")

_SESSIONS: dict = {}
_SESSIONS_LOCK = threading.Lock()

_OCR_ENGINE = None
_OCR_LOCK = threading.Lock()

# In-memory LRU cache fallback
_MEM_CACHE: dict = {}
_MEM_CACHE_LOCK = threading.Lock()
_MAX_MEM_CACHE_ITEMS = 64

# Redis Client connection (with graceful fallback)
_REDIS_CLIENT = None
_REDIS_LOCK = threading.Lock()

ALLOWED_FORMATS = {"JPEG", "JPG", "PNG", "WEBP", "BMP", "TIFF"}


def _get_redis_client():
    global _REDIS_CLIENT
    with _REDIS_LOCK:
        if _REDIS_CLIENT is None:
            try:
                import redis
                r = redis.Redis(
                    host=os.getenv("REDIS_HOST", "127.0.0.1"),
                    port=int(os.getenv("REDIS_PORT", "6379")),
                    db=0,
                    socket_timeout=1.5,
                    socket_connect_timeout=1.5,
                )
                r.ping()
                logger.info("Connected to Redis for background removal image cache.")
                _REDIS_CLIENT = r
            except Exception as e:
                logger.info(f"Redis not available locally ({e}). Using high-speed in-memory cache.")
                _REDIS_CLIENT = False
        return _REDIS_CLIENT if _REDIS_CLIENT is not False else None


def _get_session(model: str):
    with _SESSIONS_LOCK:
        if model not in _SESSIONS:
            logger.info(f"Loading rembg model session: {model}")
            _SESSIONS[model] = new_session(model)
        return _SESSIONS[model]


def _get_ocr_engine():
    global _OCR_ENGINE
    with _OCR_LOCK:
        if _OCR_ENGINE is None:
            try:
                from rapidocr_onnxruntime import RapidOCR
                _OCR_ENGINE = RapidOCR()
            except Exception as e:
                logger.warning(f"RapidOCR initialization notice: {e}.")
                _OCR_ENGINE = False
        return _OCR_ENGINE if _OCR_ENGINE is not False else None


def validate_image_bytes(image_bytes: bytes) -> tuple[int, int, str]:
    """Validates that the input bytes represent a genuine image."""
    if not image_bytes or len(image_bytes) < 12:
        raise ValueError("Image data is empty or corrupted.")

    try:
        with Image.open(io.BytesIO(image_bytes)) as probe:
            probe.verify()
    except (UnidentifiedImageError, SyntaxError, OSError):
        raise ValueError("Unsupported or corrupted image file format.") from None

    try:
        with Image.open(io.BytesIO(image_bytes)) as probe:
            fmt = (probe.format or "").upper()
            if fmt not in ALLOWED_FORMATS:
                raise ValueError(f"Unsupported image format: {fmt}. Supported formats: JPEG, PNG, WebP, BMP, TIFF.")
            w, h = probe.size
            if w <= 0 or h <= 0:
                raise ValueError("Invalid image dimensions.")
            return w, h, fmt
    except Exception as e:
        if isinstance(e, ValueError):
            raise
        raise ValueError("Unable to read image properties.") from None


def extract_text_mask_within_subject(image_rgb: np.ndarray, subject_mask: np.ndarray) -> np.ndarray:
    """
    Detects typography, headings, and labels strictly WITHIN or directly touching
    the detected salient object. Never extracts background text from shelves or walls.
    """
    h, w = image_rgb.shape[:2]
    mask = np.zeros((h, w), dtype=np.uint8)

    engine = _get_ocr_engine()
    if engine is None:
        return mask

    try:
        results, _ = engine(image_rgb)
    except Exception as e:
        logger.warning(f"OCR inference notice: {e}")
        return mask

    if not results:
        return mask

    for item in results:
        score = float(item[2])
        if score < 0.65:
            continue

        box = np.array(item[0], dtype=np.int32)
        x, y, bw, bh = cv2.boundingRect(box)
        x1, y1 = max(0, x), max(0, y)
        x2, y2 = min(w, x + bw), min(h, y + bh)

        # Only protect text if it significantly overlaps the salient subject
        roi_subj = subject_mask[y1:y2, x1:x2]
        if roi_subj.size == 0 or np.mean(roi_subj > 50) < 0.30:
            continue

        # Fill text area within subject to prevent hollow text
        cv2.fillPoly(mask, [box], 255)

    return mask


def process_image(
    image_bytes: bytes,
    model: str | None = None,
    post_process: bool = True,
    preserve_text: bool = True,
    edge_refine: bool = True,
    alpha_matting: bool = False,
    max_dimension: int = 2048,
) -> bytes:
    """
    Studio-grade background removal with solid foreground opacity,
    internal hole filling, anti-aliased edges, and zero edge fringe.
    """
    # 1. Fast Cache Lookup (Redis or In-Memory)
    cache_key = f"bg:{hashlib.sha256(image_bytes).hexdigest()}:{model or DEFAULT_MODEL}:{preserve_text}:{alpha_matting}"
    
    r_client = _get_redis_client()
    if r_client:
        try:
            cached_val = r_client.get(cache_key)
            if cached_val:
                logger.info("Background removal returned from Redis cache (<2ms).")
                return cached_val
        except Exception:
            pass
    else:
        with _MEM_CACHE_LOCK:
            if cache_key in _MEM_CACHE:
                logger.info("Background removal returned from memory cache (<1ms).")
                return _MEM_CACHE[cache_key]

    # 2. Validate image format and integrity
    validate_image_bytes(image_bytes)

    target_model = model or DEFAULT_MODEL
    session = _get_session(target_model)

    # 3. Open image in memory and normalize orientation via EXIF
    pil_img = Image.open(io.BytesIO(image_bytes))
    pil_img = ImageOps.exif_transpose(pil_img)

    # 4. Safe downscaling for oversized photos to keep latency low
    w, h = pil_img.size
    if max(w, h) > max_dimension:
        scale = max_dimension / max(w, h)
        new_size = (int(w * scale), int(h * scale))
        pil_img = pil_img.resize(new_size, Image.Resampling.LANCZOS)

    pil_rgba = pil_img.convert("RGBA")
    rgb_np = np.array(pil_img.convert("RGB"))

    # 5. Neural background removal with post_process_mask=True for clean solid core
    try:
        rembg_kwargs = {
            "session": session,
            "post_process_mask": True,
        }
        if alpha_matting:
            rembg_kwargs.update({
                "alpha_matting": True,
                "alpha_matting_foreground_threshold": 220,
                "alpha_matting_background_threshold": 20,
                "alpha_matting_erode_size": 3,
            })

        cutout = remove(pil_rgba, **rembg_kwargs)
    except Exception as e:
        logger.warning(f"Model {target_model} notice ({e}), falling back to u2net")
        fallback_session = _get_session("u2net")
        cutout = remove(pil_rgba, session=fallback_session, post_process_mask=True)

    cutout = cutout.convert("RGBA")
    neural_alpha = np.array(cutout.getchannel("A"))

    # 6. Fill internal pinholes (e.g. glare on glass, chrome, shiny surfaces, white labels)
    contours, _ = cv2.findContours(neural_alpha, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filled_contour_mask = np.zeros_like(neural_alpha)
    if contours:
        cv2.drawContours(filled_contour_mask, contours, -1, 255, -1)
        # Only fill inside detected outer hull where rembg had weak confidence
        alpha_solid = np.where((filled_contour_mask == 255) & (neural_alpha > 60), 255, neural_alpha)
    else:
        alpha_solid = neural_alpha

    # 7. Text Protection strictly inside product
    if preserve_text:
        try:
            text_mask = extract_text_mask_within_subject(rgb_np, alpha_solid)
            alpha_solid = np.maximum(alpha_solid, text_mask)
        except Exception:
            pass

    # 8. Studio-grade Edge Tuning (Solid Core + Anti-Aliased Boundary)
    if edge_refine:
        # Solid core boost: commercial products should never be ghostly translucent
        solid_mask = alpha_solid >= 180
        bg_mask = alpha_solid <= 15

        # Smooth anti-aliasing only on the 1-2 pixel transition zone
        smoothed = cv2.GaussianBlur(alpha_solid, (3, 3), 0)
        final_alpha = np.where(solid_mask, 255, smoothed)
        final_alpha = np.where(bg_mask, 0, final_alpha)
    else:
        final_alpha = np.where(alpha_solid > 128, 255, 0).astype(np.uint8)

    # 9. Clean De-Fringing: Zero out RGB wherever alpha is 0
    clean_rgb = rgb_np.copy()
    clean_rgb[final_alpha == 0] = 0

    # 10. Subtle commercial contrast & sharpness enhancement
    rgb_pil = Image.fromarray(clean_rgb)
    rgb_pil = ImageEnhance.Sharpness(rgb_pil).enhance(1.06)
    rgb_pil = ImageEnhance.Contrast(rgb_pil).enhance(1.02)

    result_img = Image.merge("RGBA", (*rgb_pil.split(), Image.fromarray(final_alpha)))

    # 11. Output to in-memory transparent PNG
    output = io.BytesIO()
    result_img.save(output, format="PNG", optimize=False)
    png_bytes = output.getvalue()

    # 12. Save to Cache
    if r_client:
        try:
            r_client.setex(cache_key, 86400, png_bytes)  # 24 hour TTL
        except Exception:
            pass
    else:
        with _MEM_CACHE_LOCK:
            if len(_MEM_CACHE) >= _MAX_MEM_CACHE_ITEMS:
                _MEM_CACHE.pop(next(iter(_MEM_CACHE)))
            _MEM_CACHE[cache_key] = png_bytes

    # Clean up memory
    output.close()
    pil_img.close()
    pil_rgba.close()
    cutout.close()
    result_img.close()
    gc.collect()

    return png_bytes
