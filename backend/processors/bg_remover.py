"""Background remover using rembg (U2Net AI model)."""

import io
from rembg import remove, new_session


# Initialize session once (loads model on first call)
_session = None


def _get_session():
    global _session
    if _session is None:
        _session = new_session("u2net")
    return _session


def remove_background(
    data: bytes,
    alpha_matting: bool = True,
    post_process: bool = True,
) -> bytes:
    """
    Remove background from image using rembg AI model.
    Returns PNG bytes with transparent background.
    """
    session = _get_session()

    result = remove(
        data,
        session=session,
        alpha_matting=alpha_matting,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=10,
        alpha_matting_erode_size=10,
        post_process_mask=post_process,
    )

    return result
