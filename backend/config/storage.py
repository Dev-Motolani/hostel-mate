"""Cloudinary storage that selects the right media type for each uploaded file."""

from pathlib import Path

import cloudinary
from cloudinary_storage.storage import MediaCloudinaryStorage


class HostelMateCloudinaryStorage(MediaCloudinaryStorage):
    """Upload videos as videos and document files as raw Cloudinary assets."""

    VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm", ".m4v", ".avi", ".mkv"}
    RAW_EXTENSIONS = {".pdf", ".doc", ".docx"}

    def _get_resource_type(self, name):
        path = Path(str(name)).as_posix().lower()
        suffix = Path(str(name)).suffix.lower()
        if suffix in self.VIDEO_EXTENSIONS or "/videos/" in f"/{path}/":
            return "video"
        if suffix in self.RAW_EXTENSIONS:
            return "raw"
        return "image"

    def _get_url(self, name):
        name = self._prepend_prefix(name)
        resource_type = self._get_resource_type(name)
        suffix = Path(name).suffix.lower()
        public_id = name[: -len(suffix)] if suffix else name
        fmt = suffix.lstrip(".") if suffix else ("mp4" if resource_type == "video" else None)
        return cloudinary.CloudinaryResource(
            public_id,
            default_resource_type=resource_type,
            format=fmt,
        ).url
