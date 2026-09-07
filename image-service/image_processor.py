import io

from PIL import Image, ImageEnhance
from rembg import new_session, remove

# Load the segmentation model once, at startup, and reuse it for every request
# (creating a session per request would reload the model each time).
#
# `u2net` is the fast, general-purpose model. The newer rembg versions default
# to `bria-rmbg-2.0`, which is ~1 GB and takes minutes per image on CPU-only
# machines — unusable for an interactive endpoint.
_SESSION = new_session("u2net")


def process_image(image_bytes: bytes) -> bytes:

    # Convert bytes → PIL Image
    image = Image.open(io.BytesIO(image_bytes))

    # Fix image mode
    image = image.convert("RGBA")

    # Remove background
    image = remove(image, session=_SESSION)

    # Enhance
    image = ImageEnhance.Sharpness(image).enhance(1.5)

    image = ImageEnhance.Contrast(image).enhance(1.1)

    # Convert back to bytes
    output = io.BytesIO()

    image.save(
        output,
        format="PNG"
    )

    return output.getvalue()