from fastapi import FastAPI, UploadFile, File
from fastapi.responses import Response

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