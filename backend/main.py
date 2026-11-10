"""
PixelForge Backend — FastAPI Server
Handles: image conversion, compression, background removal, PDF compression
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import uvicorn
import io
import os
import tempfile
from typing import Optional

from processors.converter import convert_image
from processors.compressor import compress_image, compress_pdf
from processors.bg_remover import remove_background

app = FastAPI(
    title="PixelForge API",
    description="All-in-one image & PDF processing server",
    version="1.0.0",
)

# Allow requests from the browser extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def is_image_file(file: UploadFile) -> bool:
    if file.content_type and file.content_type.startswith("image/"):
        return True
    if file.filename:
        ext = os.path.splitext(file.filename.lower())[1]
        return ext in (".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".ico", ".gif")
    return False


def is_pdf_file(file: UploadFile) -> bool:
    if file.content_type and "pdf" in file.content_type.lower():
        return True
    return bool(file.filename and file.filename.lower().endswith(".pdf"))


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "PixelForge API v1.0.0"}


@app.post("/convert")
async def convert(
    file: UploadFile = File(...),
    format: str = Form(...),  # "png" | "jpg" | "jpeg" | "webp"
    quality: int = Form(default=92),
):
    """Convert image to a target format."""
    if not is_image_file(file):
        raise HTTPException(status_code=400, detail="File must be an image.")

    try:
        data = await file.read()
        result, out_format = convert_image(data, format.lower(), quality)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image conversion failed: {str(e)}")

    mime_map = {
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "webp": "image/webp",
    }
    mime = mime_map.get(out_format, "image/png")
    filename = os.path.splitext(file.filename or "image")[0] + f".{out_format}"
    return Response(
        content=result,
        media_type=mime,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/compress/image")
async def compress_img(
    file: UploadFile = File(...),
    quality: int = Form(default=75),
    max_width: Optional[int] = Form(default=None),
    max_height: Optional[int] = Form(default=None),
):
    """Compress an image while keeping high quality."""
    if not is_image_file(file):
        raise HTTPException(status_code=400, detail="File must be an image.")

    try:
        data = await file.read()
        result, fmt = compress_image(data, quality, max_width, max_height)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image compression failed: {str(e)}")

    mime = "image/jpeg" if fmt in ("jpg", "jpeg") else f"image/{fmt}"
    ext = "jpg" if fmt == "jpeg" else fmt
    filename = os.path.splitext(file.filename or "image")[0] + f"_compressed.{ext}"
    return Response(
        content=result,
        media_type=mime,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/compress/pdf")
async def compress_pdf_route(
    file: UploadFile = File(...),
    level: int = Form(default=2),  # 1=low, 2=medium, 3=high compression
):
    """Compress a PDF document."""
    if not is_pdf_file(file):
        raise HTTPException(status_code=400, detail="File must be a PDF.")

    try:
        data = await file.read()
        result = compress_pdf(data, level)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF compression failed: {str(e)}")

    filename = os.path.splitext(file.filename or "document")[0] + "_compressed.pdf"
    return Response(
        content=result,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/remove-background")
async def remove_bg(
    file: UploadFile = File(...),
    alpha_matting: bool = Form(default=True),
    post_process: bool = Form(default=True),
):
    """Remove background from an image using AI (rembg/U2Net)."""
    if not is_image_file(file):
        raise HTTPException(status_code=400, detail="File must be an image.")

    try:
        data = await file.read()
        result = remove_background(data, alpha_matting, post_process)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Background removal failed: {str(e)}")

    filename = os.path.splitext(file.filename or "image")[0] + "_no_bg.png"
    return Response(
        content=result,
        media_type="image/png",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=7832, reload=False)
