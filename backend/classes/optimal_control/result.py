from typing import TypedDict

from classes.common.data import Data


class OptimalControlResult(TypedDict):
    compartments: dict[str, Data]
    interventions: dict[str, Data]
    noControlObjective: float
    optimalObjective: float
