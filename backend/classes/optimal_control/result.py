from typing import TypedDict

from classes.common.data import Data


class OptimalControlResult(TypedDict):
    noControlCompartments: dict[str, Data]
    optimalCompartments: dict[str, Data]
    interventions: dict[str, Data]
    adjointModel: dict[str, str]
    noControlObjective: float
    optimalObjective: float
