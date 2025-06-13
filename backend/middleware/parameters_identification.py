import numpy as np
import numpy.typing as npt
import sympy as sp
from scipy.optimize import minimize

from classes.common.approximation_type import ApproximationType
from classes.common.data import Data
from classes.common.error_response import ErrorResponse
from classes.common.values import Values
from classes.model.continuity_type import ContinuityType
from classes.model.datatable import Datatable
from classes.model.model import Model
from classes.model.runtime_model import RuntimeModel
from classes.parameters_identification.parameters import PIParameters
from classes.parameters_identification.selected_constant import SelectedConstant
from classes.parameters_identification.success_response import PISuccessResponse
from functions.is_population_preserved import is_population_preserved
from functions.model_to_runtime_model import model_to_runtime_model
from functions.simulate import simulate


def parameters_identification(
    parameters: PIParameters, model: Model
) -> PISuccessResponse | ErrorResponse:
    try:
        runtime_model: RuntimeModel = model_to_runtime_model(model)

        validate_model(runtime_model, parameters["selectedConstants"])

        data_end_time: float = max(
            max(values["times"]) for values in parameters["data"].values()
        )
        times: npt.NDArray[np.float64] = np.linspace(
            0,
            data_end_time + parameters["forecastTime"],
            parameters["nodesAmount"] + 1,
            dtype=np.float64,
        )
        variables_datatable: Datatable = Datatable()

        variables_datatable.set_constants(
            {
                constant["name"]: Values(
                    times,
                    np.repeat(
                        (
                            parameters["selectedConstants"][constant["name"]]["value"]
                            if constant["name"] in parameters["selectedConstants"]
                            else constant["value"]
                        ),
                        times.size,
                    ),
                    ApproximationType.PIECEWISE_CONSTANT,
                )
                for constant in runtime_model["constants"]
            }
        )
        variables_datatable.set_interventions(
            {
                intervention["name"]: Values(
                    times,
                    np.zeros(times.size),
                    ApproximationType.PIECEWISE_CONSTANT,
                )
                for intervention in runtime_model["interventions"]
            }
        )

        minimize_result = minimize(
            optimization_criteria,
            [
                constant["value"]
                for constant in parameters["selectedConstants"].values()
            ],
            args=(parameters, model, variables_datatable),
            bounds=[
                (constant["lowerBoundary"], constant["upperBoundary"])
                for constant in parameters["selectedConstants"].values()
            ],
            method="L-BFGS-B",
        )

        simulate(runtime_model, times, variables_datatable)

        return {
            "type": "PI",
            "parameters": parameters,
            "model": model,
            "result": {
                "approximation": variables_datatable.compartments_data,
                "constants": {
                    name: minimize_result.x[i]
                    for i, name in enumerate(parameters["selectedConstants"])
                },
            },
        }

    except RuntimeError as error:
        return ErrorResponse(
            {
                "error": str(error),
            }
        )

    except Exception as error:
        print(error)

        return ErrorResponse(
            {
                "error": "There is an error in the back end",
            }
        )


def optimization_criteria(
    constants: list[float],
    times: npt.NDArray[np.float64],
    parameters: PIParameters,
    model: RuntimeModel,
    variables_datatable: Datatable,
) -> float:
    variables_datatable.update_constants(
        {
            constant: Values(
                times,
                np.repeat(constants[i], times.size),
                ApproximationType.PIECEWISE_CONSTANT,
            )
            for i, constant in enumerate(parameters["selectedConstants"])
        }
    )

    simulate(model, times, variables_datatable)

    return calculate_objective(
        parameters["data"],
        variables_datatable.compartments,
    )


def calculate_objective(
    data: dict[str, Data],
    simulated_data: dict[str, Values],
) -> float:
    cost: float = 0

    for name, known_data in data.items():
        known_values: list[float] = known_data["values"]
        simulated_values: npt.NDArray[np.float64] = simulated_data[name](
            known_data["times"]
        )

        cost += np.sum((known_values - simulated_values) ** 2)

    return cost


def validate_model(
    runtime_model: RuntimeModel,
    selected_constants: dict[str, SelectedConstant],
) -> None:
    for compartment in runtime_model["compartments"].values():
        continuity_status: dict[str, ContinuityType] = {
            **{
                name: compartment["equation"].check_continuity(
                    name, sp.Interval(0, sp.oo)
                )
                for name in runtime_model["compartments"]
            },
            **{
                name: compartment["equation"].check_continuity(
                    name,
                    sp.Interval(
                        boundaries["lowerBoundary"],
                        boundaries["upperBoundary"],
                    ),
                )
                for name, boundaries in selected_constants.items()
            },
            **{
                constant["name"]: compartment["equation"].check_continuity(
                    constant["name"],
                    sp.Interval(constant["value"], constant["value"]),
                )
                for constant in runtime_model["constants"]
                if not constant["name"] in selected_constants
            },
        }

        if not all(
            [
                continuity_type == ContinuityType.CONTINUOUS
                for continuity_type in continuity_status.items()
            ]
        ):
            discontinuous_variables: list[str] = [
                variable
                for variable, continuity_type in continuity_status.items()
                if continuity_type == ContinuityType.DISCONTINUOUS
            ]

            raise RuntimeError(
                f"Equation of {compartment["name"]} is"
                + (
                    f"\nDiscontinuous by: {", ".join(discontinuous_variables)}"
                    if len(discontinuous_variables)
                    else ""
                )
            )

    if not is_population_preserved(runtime_model):
        raise RuntimeError(
            "Model equations do not preserve population\n\n"
            + "Apparently that is result of a program bug. Please reload the page and try again",
        )
