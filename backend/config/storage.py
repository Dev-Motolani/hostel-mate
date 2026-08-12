"""Cloudinary storage that selects the right media type for each uploaded file."""

from pathlib import Path

from cloudinary_storage.storage import MediaCloudinaryStorage


class HostelMateCloudinaryStorage(MediaCloudinaryStorage):
    """Upload videos as videos and document files as raw Cloudinary assets."""

    VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm", ".m4v", ".avi", ".mkv"}
    RAW_EXTENSIONS = {".pdf", ".doc", ".docx"}

    def _get_resource_type(self, name):
        suffix = Path(name).suffix.lower()
        if suffix in self.VIDEO_EXTENSIONS:
            return "video"
        if suffix in self.RAW_EXTENSIONS:
            return "raw"
        return "image"
