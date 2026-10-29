"""Local input filtering; blocked text never reaches a dialogue provider."""
import json
import re
import unicodedata
from pathlib import Path

from fastapi import HTTPException

_rules = json.loads(Path(__file__).with_name("profanity_rules.json").read_text(encoding="utf-8"))
PROFANITY_MESSAGE = _rules["message"]
_patterns = [re.compile(unicodedata.normalize("NFKC", pattern), re.IGNORECASE) for pattern in _rules["patterns"]]


def contains_profanity(text: str) -> bool:
    normalized = unicodedata.normalize("NFKC", text).lower()
    normalized = "".join(char for char in normalized if not char.isspace() and unicodedata.category(char)[0] not in {"P", "S", "C"})
    return any(pattern.search(normalized) for pattern in _patterns)


def reject_profanity(*texts: str) -> None:
    if any(contains_profanity(text) for text in texts):
        raise HTTPException(422, detail={"code": "profanity", "message": PROFANITY_MESSAGE})
