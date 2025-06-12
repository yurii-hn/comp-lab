from typing import TypedDict

from classes.common.data import Data


class PIResult(TypedDict):
    constants: dict[str, float]
    approximation: dict[str, Data]
