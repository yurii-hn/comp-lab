from typing import TypedDict

from classes.model.equation import Equation


class AdjointModel(TypedDict):
    lambdas: dict[str, Equation]
