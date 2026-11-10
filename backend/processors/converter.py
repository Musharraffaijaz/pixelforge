"""Image format converter using Pillow."""

import io
from PIL import Image
from typing import Tuple


FORMAT_MAP = {
    "jpg": "JPEG",
    "jpeg": "JPEG",
    "png": "PNG",
    "webp": "WEBP",
}


def convert_image(data: bytes, target_format: str, quality: int = 92) -> Tuple[bytes, str]:
    """
    Convert image bytes to the target format.
    Returns (output_bytes, extension).
    """
    fmt = FORMAT_MAP.get(target_format, "PNG")
    ext = target_format if target_format != "jpeg" else "jpg"

    img = Image.open(io.BytesIO(data))

    # Flatten alpha for JPEG (no alpha channel support)
    if fmt == "JPEG" and img.mode in ("RGBA", "LA", "P"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        background.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
        img = background
    elif img.mode == "P":
        img = img.convert("RGBA" if fmt == "PNG" else "RGB")

    buf = io.BytesIO()
    save_kwargs = {"format": fmt}
    if fmt in ("JPEG", "WEBP"):
        save_kwargs["quality"] = quality
        save_kwargs["optimize"] = True
    if fmt == "PNG":
        save_kwargs["optimize"] = True

    img.save(buf, **save_kwargs)
    return buf.getvalue(), ext
