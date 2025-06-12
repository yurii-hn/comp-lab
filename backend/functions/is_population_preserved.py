from functools import reduce
from operator import add
import sympy as sp

from classes.model.runtime_model import RuntimeModel


def is_population_preserved(
    model: RuntimeModel,
) -> bool:
    accumulator: sp.Expr = reduce(
        add,
        [
            compartment["equation"].expression
            for compartment in model["compartments"].values()
        ],
    )

    if sp.nsimplify(accumulator, tolerance=1e-10) != 0:
        return False

    return True
