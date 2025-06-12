from typing import TypedDict


class ValidationRequestBody(TypedDict):
    expression: str
    allowedSymbols: list[str]
