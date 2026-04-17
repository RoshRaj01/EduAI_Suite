from fastapi import HTTPException, UploadFile
from pathlib import Path
from uuid import uuid4
from typing import Optional
import shutil
import re

BASE_UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
ALLOWED_FILE_EXTENSIONS = {".pdf", ".pptx", ".docx", ".png", ".jpg", ".jpeg", ".zip"}

BASE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
for folder in ("assignments", "announcements", "courses", "submissions"):
    (BASE_UPLOAD_DIR / folder).mkdir(parents=True, exist_ok=True)


def _safe_filename(filename: str) -> str:
    name = Path(filename).name
    name = re.sub(r"[^A-Za-z0-9._-]", "_", name)
    return name or "upload"


def save_optional_upload(file: Optional[UploadFile], folder: str) -> Optional[str]:
    if not file:
        return None

    extension = Path(file.filename or "").suffix.lower()
    if extension not in ALLOWED_FILE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, PPTX, and DOCX files are allowed.",
        )

    safe_name = _safe_filename(file.filename or "upload")
    saved_name = f"{uuid4().hex}_{safe_name}"
    relative_url = f"/uploads/{folder}/{saved_name}"
    disk_path = BASE_UPLOAD_DIR / folder / saved_name

    with open(disk_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return relative_url
