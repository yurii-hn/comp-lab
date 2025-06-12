from typing import TypedDict


class ValidationResponse(TypedDict):
    valid: bool
    message: str | None
