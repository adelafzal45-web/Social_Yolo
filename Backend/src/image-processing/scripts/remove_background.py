"""Standalone background removal CLI script invoked directly by NestJS Backend.
No HTTP microservice or extra port needed. Uses rembg with cached model weights.
"""

import sys
import os
import io
import time

def main():
    if len(sys.argv) < 3:
        print("Usage: python remove_background.py <input_path> <output_path> [model_name]", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    model_name = sys.argv[3] if len(sys.argv) > 3 else "u2net_human_seg"

    # Normalize model name
    valid_models = {
        "u2net_human_seg",
        "isnet-general-use",
        "bria-rmbg",
        "u2net",
        "birefnet-general-lite",
    }
    if model_name not in valid_models:
        # Default human seg for portrait/clothing or isnet for general
        if any(k in model_name.lower() for k in ["human", "person", "fashion", "portrait", "cloth", "dress"]):
            model_name = "u2net_human_seg"
        else:
            model_name = "u2net_human_seg"  # Most versatile for user creative studio

    try:
        import rembg
        from PIL import Image

        with open(input_path, "rb") as f:
            input_bytes = f.read()

        session = rembg.new_session(model_name)
        output_bytes = rembg.remove(input_bytes, session=session)

        with open(output_path, "wb") as f:
            f.write(output_bytes)

        sys.stdout.write(f"OK:{len(output_bytes)}")
        sys.stdout.flush()
        sys.exit(0)
    except Exception as e:
        sys.stderr.write(f"ERROR:{str(e)}")
        sys.stderr.flush()
        sys.exit(2)

if __name__ == '__main__':
    main()
