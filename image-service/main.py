from fastapi import FastAPI, UploadFile, File, Query, HTTPException
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging

from image_processor import process_image

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="Social Yolo - Background Removal & Text Preservation Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_UPLOAD_SIZE = 15 * 1024 * 1024  # 15 MB


@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "Social Yolo Image AI Service is running",
        "service": "rembg + rapidocr",
        "features": ["background-removal", "text-preservation", "bilateral-edge-refinement"],
        "models_available": ["isnet-general-use", "bria-rmbg", "birefnet-general-lite", "u2net"],
    }


@app.post("/process-image")
async def process_image_endpoint(
    file: UploadFile = File(...),
    model: str = Query(None, description="Optional model: 'isnet-general-use' (default), 'bria-rmbg', 'u2net'"),
    preserve_text: bool = Query(True, description="Detect and preserve all typography, slogans, and badges"),
    post_process: bool = Query(False, description="Apply morphological cleanup (disabled by default to protect fine details)"),
    edge_refine: bool = Query(True, description="Smooth edge transitions with sub-pixel bilateral filtering"),
    alpha_matting: bool = Query(False, description="Enable alpha matting for complex hair and silhouettes"),
):
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty file uploaded.")

        if len(image_bytes) > MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Uploaded file exceeds maximum limit of {MAX_UPLOAD_SIZE // (1024 * 1024)} MB."
            )

        processed_image = process_image(
            image_bytes=image_bytes,
            model=model,
            post_process=post_process,
            preserve_text=preserve_text,
            edge_refine=edge_refine,
            alpha_matting=alpha_matting,
        )

        return Response(
            content=processed_image,
            media_type="image/png",
            headers={
                "Cache-Control": "no-cache",
                "X-Background-Removed": "true",
                "X-Text-Preserved": str(preserve_text).lower(),
            },
        )
    except ValueError as ve:
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid Image", "detail": str(ve)},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Background removal failed unexpectedly: {type(e).__name__}: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Background removal failed", "detail": str(e)},
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)