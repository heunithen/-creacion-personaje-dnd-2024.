from __future__ import annotations

import io
import json
import os
import re
import urllib.error
import urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PORTRAIT_DIR = ROOT / "public/images/character-creation/portraits"
APP_FILE = ROOT / "src/App.svelte"
SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
BUCKET = "character-portraits"
HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}


def request(url: str, method: str = "GET", data: bytes | None = None, headers: dict | None = None):
    merged = dict(HEADERS)
    if headers:
        merged.update(headers)
    req = urllib.request.Request(url, data=data, headers=merged, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as error:
        return error.code, error.read()


def to_square_webp(raw: bytes) -> bytes:
    with Image.open(io.BytesIO(raw)) as source:
        image = source.convert("RGBA" if "A" in source.getbands() else "RGB")
        side = min(image.width, image.height)
        # Preserve the top of each portrait and trim any excess from the bottom.
        image = image.crop((0, 0, side, side))
        image = image.resize((512, 512), Image.Resampling.LANCZOS)
        output = io.BytesIO()
        image.save(output, format="WEBP", quality=90, method=6)
        return output.getvalue()


def main():
    match = re.search(r"let BUILDER_PORTRAITS: string\[\] = (\[[^\n]+\]);", APP_FILE.read_text())
    if not match:
        raise RuntimeError("Could not read the existing portrait source list from src/App.svelte")
    old_urls = json.loads(match.group(1))

    jobs: list[tuple[str, str, Path | None]] = []
    for url in old_urls:
        filename = url.rsplit("/", 1)[-1]
        jobs.append((filename, url, None))
    for source in sorted(PORTRAIT_DIR.glob("*.jpeg")):
        jobs.append((source.stem + ".webp", source.name, source))

    catalog_url = f"{SUPABASE_URL}/rest/v1/character_portraits?select=object_path"
    status, body = request(catalog_url)
    if status != 200:
        raise RuntimeError(f"Could not read portrait catalog ({status}): {body.decode(errors='replace')}")
    known = {row["object_path"] for row in json.loads(body)}

    records = []
    uploaded = 0
    for output_name, source_name, local_path in jobs:
        if local_path is None:
            source_url = next(url for url in old_urls if url.endswith("/" + source_name))
        else:
            source_url = None
        target_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/square/{output_name}"
        head_status, _ = request(target_url, method="HEAD")
        if head_status == 404:
            if local_path is not None:
                raw = local_path.read_bytes()
            else:
                source_status, raw = request(source_url)
                if source_status != 200:
                    raise RuntimeError(f"Could not download {source_name} ({source_status})")
            webp = to_square_webp(raw)
            upload_status, upload_body = request(
                f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/square/{output_name}",
                method="POST",
                data=webp,
                headers={"Content-Type": "image/webp"},
            )
            if upload_status not in (200, 201):
                raise RuntimeError(f"Storage upload failed for {output_name} ({upload_status}): {upload_body.decode(errors='replace')}")
            uploaded += 1
        elif head_status != 200:
            raise RuntimeError(f"Storage HEAD failed for {output_name} ({head_status})")
        records.append({"object_path": output_name, "source_filename": source_name})

    if records:
        payload = json.dumps(records).encode()
        status, body = request(
            f"{SUPABASE_URL}/rest/v1/character_portraits?on_conflict=object_path",
            method="POST",
            data=payload,
            headers={"Content-Type": "application/json", "Prefer": "resolution=ignore-duplicates,return=minimal"},
        )
        if status not in (200, 201, 204):
            raise RuntimeError(f"Database catalog insert failed ({status}): {body.decode(errors='replace')}")

    print(f"Square WebP portraits ready: {len(records)} catalog records; {uploaded} new Storage uploads; {len(old_urls)} existing + {len(jobs) - len(old_urls)} new sources.")


if __name__ == "__main__":
    main()
