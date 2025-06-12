from enum import Enum


class ApproximationType(str, Enum):
    PIECEWISE_CONSTANT = "piecewise-constant"
    PIECEWISE_LINEAR = "piecewise-linear"
