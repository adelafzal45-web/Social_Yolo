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


# Allows starting the server directly with:  python main.py
# (equivalent to: uvicorn main:app --host 0.0.0.0 --port 8000)
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)