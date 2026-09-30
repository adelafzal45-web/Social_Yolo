"""Benchmark rembg models: timing + side-by-side output images.

Usage:
    python benchmark_models.py <image_path> <output_dir> <model1> [model2 ...]

Each model is loaded lazily (first run downloads the ONNX weights), then the
image is processed and saved as <output_dir>/<model>.png.
"""
import sys
import time
from pathlib import Path

from PIL import Image
from rembg import new_session, remove


def main() -> None:
    image_path, outdir, *models = sys.argv[1:]
    Path(outdir).mkdir(parents=True, exist_ok=True)

    image = Image.open(image_path).convert("RGBA")
    print(f"input: {image_path} {image.size} {image.mode}")

    for model in models:
        t0 = time.perf_counter()
        session = new_session(model)  # downloads on first use
        load_s = time.perf_counter() - t0

        t0 = time.perf_counter()
        result = remove(image, session=session)
        infer_s = time.perf_counter() - t0

        out_file = Path(outdir) / f"{model}.png"
        result.save(out_file)
        print(f"{model}: load={load_s:.0f}s infer={infer_s:.1f}s -> {out_file}")


if __name__ == "__main__":
    main()
