from typing import TypedDict


class Flow(TypedDict):
    id: str
    source: str
    target: str
    equation: str
