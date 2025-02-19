"""Intervention Boundaries Definition"""

from typing import TypedDict


class InterventionBoundariesDefinition(TypedDict):
    """Intervention Boundaries Definition"""

    id: str
    name: str
    upperBoundary: float
    lowerBoundary: float
