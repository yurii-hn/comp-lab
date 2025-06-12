from typing import TypedDict

from classes.optimal_control.intervention_parameters import (
    InterventionParameters,
)


class OptimalControlParameters(TypedDict):
    time: float
    nodesAmount: int
    objectiveFunction: str
    intervention: InterventionParameters
