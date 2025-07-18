import numpy as np
import numpy.typing as npt
import sympy as sp

from classes.common.interpolation_type import InterpolationType
from classes.common.error_response import ErrorResponse
from classes.common.values import Values
from classes.model.continuity_type import ContinuityType
from classes.model.datatable import Datatable
from classes.model.model import Model
from classes.model.runtime_model import RuntimeModel
from classes.simulation.parameters import SimulationParameters
from classes.simulation.success_response import SimulationSuccessResponse
from functions.is_population_preserved import is_population_preserved
from functions.model_to_runtime_model import model_to_runtime_model
from functions.simulate import simulate


def simulation(
    parameters: SimulationParameters, model: Model
) -> SimulationSuccessResponse | ErrorResponse:
    try:
        runtime_model: RuntimeModel = model_to_runtime_model(model)

        validate_model(runtime_model)

        times: npt.NDArray[np.float64] = np.linspace(
            0,
            parameters["time"],
            parameters["nodesAmount"] + 1,
            dtype=np.float64,
        )
        variables_datatable: Datatable = Datatable()

        variables_datatable.set_constants(
            {
                constant["name"]: Values(
                    times,
                    np.repeat(constant["value"], times.size),
                    InterpolationType.PIECEWISE_CONSTANT,
                )
                for constant in runtime_model["constants"]
            }
        )
        variables_datatable.set_interventions(
            {
                intervention["name"]: Values(
                    times,
                    np.zeros(times.size),
                    InterpolationType.PIECEWISE_CONSTANT,
                )
                for intervention in runtime_model["interventions"]
            }
        )

        simulate(runtime_model, times, variables_datatable)

        return {
            "type": "Simulation",
            "parameters": parameters,
            "model": model,
            "result": {
                "compartments": variables_datatable.compartments_data,
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


def validate_model(runtime_model: RuntimeModel) -> None:
    for compartment in runtime_model["compartments"].values():
        continuity_status: dict[str, ContinuityType] = {
            **{
                name: compartment["equation"].check_continuity(
                    name, sp.Interval(0, sp.oo)
                )
                for name in runtime_model["compartments"]
            },
            **{
                constant["name"]: compartment["equation"].check_continuity(
                    constant["name"],
                    sp.Interval(constant["value"], constant["value"]),
                )
                for constant in runtime_model["constants"]
            },
        }

        if not all(
            [
                continuity_type == ContinuityType.CONTINUOUS
                for continuity_type in continuity_status.values()
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
