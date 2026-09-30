"""High-performance persistent background removal worker using rembg (bria-rmbg).
Communicates with NestJS over stdin/stdout using 4-byte length-prefixed binary packets.
Model is loaded once at startup and kept warm in memory for ~1.5-2.5s inference.
"""

import sys
import struct
import io
import rembg

def main():
    # Load model once at worker startup
    model_name = "bria-rmbg"
    session = rembg.new_session(model_name)
    # Signal readiness to parent Node.js process
    sys.stderr.write("READY\n")
    sys.stderr.flush()

    while True:
        # Read 4-byte length prefix (big-endian unsigned int)
        header = sys.stdin.buffer.read(4)
        if not header or len(header) < 4:
            break
        
        length = struct.unpack(">I", header)[0]
        # Read image bytes
        image_bytes = bytearray()
        while len(image_bytes) < length:
            chunk = sys.stdin.buffer.read(length - len(image_bytes))
            if not chunk:
                break
            image_bytes.extend(chunk)
        
        try:
            # Process image with warm session
            output_png = rembg.remove(bytes(image_bytes), session=session)
            # Write 4-byte success flag (1) + 4-byte length + payload
            sys.stdout.buffer.write(struct.pack(">II", 1, len(output_png)))
            sys.stdout.buffer.write(output_png)
            sys.stdout.buffer.flush()
        except Exception as e:
            err_msg = str(e).encode('utf-8')
            # Write 4-byte failure flag (0) + 4-byte length + error message
            sys.stdout.buffer.write(struct.pack(">II", 0, len(err_msg)))
            sys.stdout.buffer.write(err_msg)
            sys.stdout.buffer.flush()

if __name__ == '__main__':
    main()
