from typing import TypedDict

from classes.common.data import Data


class SimulationResult(TypedDict):
    compartments: dict[str, Data]
