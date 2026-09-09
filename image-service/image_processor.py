"""Background removal and enhancement for the image microservice."""

import io
import os
import threading

from PIL import Image, ImageEnhance
from rembg import new_session, remove

# Any rembg model name works here (see https://github.com/danielgatis/rembg).
# Measured on this machine (CPU-only, 512x512 sample photo):
#   birefnet-general-lite  ~36 s/img — SOTA edge quality (default)
#   isnet-general-use      ~2.6 s/img — very good quality, much faster
#   u2net                  ~1.1 s/img — legacy baseline (old default)
# Switch via the IMAGE_SERVICE_MODEL environment variable.
DEFAULT_MODEL = os.getenv("IMAGE_SERVICE_MODEL", "birefnet-general-lite")

# Sessions are loaded once per model and reused for every request
# (creating a session per request would reload the model each time).
_SESSIONS: dict = {}
_SESSIONS_LOCK = threading.Lock()


def _get_session(model: str):
    with _SESSIONS_LOCK:
        if model not in _SESSIONS:
            _SESSIONS[model] = new_session(model)
        return _SESSIONS[model]


def process_image(image_bytes: bytes, model: str | None = None) -> bytes:

    session = _get_session(model or DEFAULT_MODEL)

    # Convert bytes -> PIL Image and normalise the mode
    image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

    # Remove the background - produces the alpha matte
    image = remove(image, session=session)

    # Enhance the RGB channels only. Sharpening the alpha matte as well (the
    # old behaviour) creates dark/bright halos around the cutout edges, and
    # sharpness 1.5 was harsh - 1.2 keeps detail without the crunch.
    rgb = image.convert("RGB")
    rgb = ImageEnhance.Sharpness(rgb).enhance(1.2)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.05)
    image = Image.merge("RGBA", (*rgb.split(), image.getchannel("A")))

    # Convert back to bytes
    output = io.BytesIO()

    image.save(
        output,
        format="PNG"
    )

    return output.getvalue()
