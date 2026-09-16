"""Preloads the CLIP model into memory (also downloads it on first run).

Run from image-service/:
    ..\\.venv\\Scripts\\python.exe warmup_clip.py
Useful once after starting the service so the first real embedding
request does not wait for the model download/load.
"""

import clip_encoder

clip_encoder._load_model()
print(clip_encoder.model_info())
