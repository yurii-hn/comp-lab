"""Optimal Control Request Body Definition"""

from typing import TypedDict

from core.definitions.model.model import ModelDefinition
from core.definitions.optimal_control.parameters import \
    OptimalControlParametersDefinition


class OptimalControlRequestBodyDefinition(TypedDict):
    """Optimal Control Request Body Definition"""

    parameters: OptimalControlParametersDefinition
    model: ModelDefinition
