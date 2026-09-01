"""Verified YouTube videos for the gym library.

Populated by tools/find_videos.py: each id came from a YouTube search whose title
matched the exercise, and was then confirmed playable inside an embed. Kept as
JSON so the generator never has to emit Python source.
"""
import json
import pathlib

_PATH = pathlib.Path(__file__).with_name("videos.json")

GYM_VIDEOS = json.loads(_PATH.read_text(encoding="utf-8")) if _PATH.exists() else {}
