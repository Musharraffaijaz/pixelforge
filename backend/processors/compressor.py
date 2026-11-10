"""Image and PDF compressor."""

import io
import tempfile
import os
from typing import Optional, Tuple
from PIL import Image


def compress_image(
    data: bytes,
    quality: int = 75,
    max_width: Optional[int] = None,
    max_height: Optional[int] = None,
) -> Tuple[bytes, str]:
    """
    Compress an image. Optionally resize to max dimensions.
    Returns (output_bytes, format_extension).
    """
    img = Image.open(io.BytesIO(data))
    original_format = (img.format or "PNG").upper()

    # Resize if needed
    if max_width or max_height:
        w, h = img.size
        mw = max_width or w
        mh = max_height or h
        ratio = min(mw / w, mh / h)
        if ratio < 1.0:
            new_size = (int(w * ratio), int(h * ratio))
            img = img.resize(new_size, Image.LANCZOS)

    # Determine output format
    if original_format in ("JPEG", "JPG"):
        fmt, ext = "JPEG", "jpg"
    elif original_format == "WEBP":
        fmt, ext = "WEBP", "webp"
    else:
        # For PNG and others, convert to WebP for better compression
        fmt, ext = "WEBP", "webp"

    # Flatten alpha for JPEG
    if fmt == "JPEG" and img.mode in ("RGBA", "LA", "P"):
        bg = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        bg.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
        img = bg

    buf = io.BytesIO()
    img.save(buf, format=fmt, quality=quality, optimize=True)
    return buf.getvalue(), ext


def compress_pdf(data: bytes, level: int = 2) -> bytes:
    """
    Compress a PDF using PyMuPDF (fitz).
    level: 1=low, 2=medium, 3=high compression
    """
    try:
        import pymupdf as fitz
    except ImportError:
        try:
            import fitz
        except ImportError:
            raise RuntimeError("PyMuPDF not installed. Run: pip install pymupdf")

    # Compression garbage collection flags
    garbage_map = {1: 0, 2: 2, 3: 4}
    deflate_map = {1: False, 2: True, 3: True}
    image_quality_map = {1: 90, 2: 70, 3: 45}

    garbage = garbage_map.get(level, 2)
    deflate = deflate_map.get(level, True)
    img_quality = image_quality_map.get(level, 70)

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_in:
        tmp_in.write(data)
        tmp_in_path = tmp_in.name

    tmp_out_path = tmp_in_path.replace(".pdf", "_out.pdf")

    try:
        doc = fitz.open(tmp_in_path)

        # Downscale embedded images based on compression level
        for page in doc:
            image_list = page.get_images(full=True)
            for img_info in image_list:
                xref = img_info[0]
                try:
                    base_image = doc.extract_image(xref)
                    img_bytes = base_image["image"]
                    img_ext = base_image["ext"]

                    # Only recompress JPEG images for levels 2 and 3
                    if level >= 2 and img_ext in ("jpeg", "jpg"):
                        pil_img = Image.open(io.BytesIO(img_bytes))
                        buf = io.BytesIO()
                        pil_img.save(buf, format="JPEG", quality=img_quality, optimize=True)
                        doc.update_stream(xref, buf.getvalue())
                except Exception:
                    pass  # Skip images that fail

        doc.save(
            tmp_out_path,
            garbage=garbage,
            deflate=deflate,
            deflate_images=deflate,
            deflate_fonts=deflate,
        )
        doc.close()

        with open(tmp_out_path, "rb") as f:
            result = f.read()
    finally:
        os.unlink(tmp_in_path)
        if os.path.exists(tmp_out_path):
            os.unlink(tmp_out_path)

    return result
