from enum import Enum


class InterpolationType(str, Enum):
    PIECEWISE_CONSTANT = "piecewise-constant"
    PIECEWISE_LINEAR = "piecewise-linear"
