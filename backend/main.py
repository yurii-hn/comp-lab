"""
Main module

This module contains the main application logic.
"""

from flask import Flask, request, jsonify

from simulate import simulate
from optimal_control import optimal_control
from parameters_identification import parameters_identification
from validate_expression import validate_expression
from definitions import (
    IModelWithInterventions,
    IRequestSimulationParameters,
    ISimulationRequestPayload,
    IRawSimulationRequestData,
    ISimulationRequestData,
    IRawOptimalControlRequestData,
    IOptimalControlRequestData,
    ISimulationResponse,
    IOptimalControlResponse,
    IRawValidationPayload,
    IValidationPayload,
    IValidationResult,
    IRequestOptimalControlParameters,
    IOptimalControlRequestPayload,
    IRawPIRequestData,
    IPIRequestData,
    is_IRawPIRequestDataWithInterventions,
    IPIRequestDataWithInterventions,
    IPIRequestDataWithoutInterventions,
    IRequestPIParameters,
    IPISelectedConstant,
    IPIResponse,
    ISolutionWithoutInterventions,
    ISolutionWithInterventions,
    IPIRequestPayloadWithoutInterventions,
    IPIRequestPayloadWithInterventions,
    ISolutionData,
    IModel
)

app: Flask = Flask(__name__)


@app.route('/simulate', methods=['POST'])
def simulate_endpoint():
    """
    Simulation endpoint

    This endpoint is used for basic model simulation
    """

    raw_data: IRawSimulationRequestData = request.get_json()

    simulation_data: ISimulationRequestData = ISimulationRequestData(
        IRequestSimulationParameters(
            raw_data['parameters']['time'],
            raw_data['parameters']['nodesAmount']
        ),
        ISimulationRequestPayload(
            raw_data['payload']['compartments'],
            raw_data['payload']['constants']
        )
    )

    result: ISimulationResponse = simulate(simulation_data)

    return jsonify(result)


@app.route('/optimal-control', methods=['POST'])
def optimal_control_endpoint():
    """
    Optimal control endpoint

    This endpoint is used for solving the optimal control problem
    """

    raw_data: IRawOptimalControlRequestData = request.get_json()

    data: IOptimalControlRequestData = IOptimalControlRequestData(
        IRequestOptimalControlParameters(
            raw_data['parameters']['time'],
            raw_data['parameters']['nodesAmount'],
            raw_data['parameters']['costFunction'],
            raw_data['parameters']['interventionNodesAmount'],
            raw_data['parameters']['interventionUpperBoundary'],
            raw_data['parameters']['interventionLowerBoundary'],
            raw_data['parameters']['interventionApproximationType']
        ),
        IOptimalControlRequestPayload(
            raw_data['payload']['compartments'],
            raw_data['payload']['constants'],
            raw_data['payload']['interventions']
        )
    )

    result: IOptimalControlResponse = optimal_control(data)

    return jsonify(result)


@app.route('/parameters-identification', methods=['POST'])
def parameters_identification_endpoint():
    """
    Parameters identification endpoint

    This endpoint is used for identifying the parameters of the model
    """

    raw_data: IRawPIRequestData = request.get_json()

    is_with_interventions: bool = is_IRawPIRequestDataWithInterventions(
        raw_data
    )

    request_parameters: IRequestPIParameters = IRequestPIParameters(
        [
            IPISelectedConstant(
                constant['name'],
                constant['value'],
                constant['upperBoundary'],
                constant['lowerBoundary'],
            )
            for constant in raw_data['parameters']['selectedConstants']
        ],
        raw_data['parameters']['timeStep']
    )

    data: IPIRequestData = (
        IPIRequestDataWithoutInterventions(
            request_parameters,
            IPIRequestPayloadWithoutInterventions(
                ISolutionWithoutInterventions(
                    [
                        ISolutionData(
                            compartment['name'],
                            compartment['values'],
                        )
                        for compartment in raw_data['payload']['solution']['compartments']
                    ]
                ),
                IModel(
                    raw_data['payload']['model']['compartments'],
                    raw_data['payload']['model']['constants']
                )
            )
        )
        if not is_with_interventions else
        IPIRequestDataWithInterventions(
            request_parameters,
            IPIRequestPayloadWithInterventions(
                ISolutionWithInterventions(
                    [
                        ISolutionData(
                            compartment['name'],
                            compartment['values'],
                        )
                        for compartment in raw_data['payload']['solution']['compartments']
                    ],
                    [
                        ISolutionData(
                            intervention['name'],
                            intervention['values'],
                        )
                        for intervention in raw_data['payload']['solution']['interventions']
                    ]
                ),
                IModelWithInterventions(
                    raw_data['payload']['model']['compartments'],
                    raw_data['payload']['model']['constants'],
                    raw_data['payload']['model']['interventions']
                )
            )
        )
    )

    result: IPIResponse = parameters_identification(data)

    return jsonify(result)


@app.route('/validate-expression', methods=['POST'])
def validate_expression_endpoint():
    """
    Expression validation endpoint

    This endpoint is used for validating the expressions
    """

    raw_data: IRawValidationPayload = request.get_json()

    data: IValidationPayload = IValidationPayload(
        raw_data['expression'],
        raw_data['allowedSymbols'],
    )

    result: IValidationResult = validate_expression(data)

    return jsonify({
        'isValid': result.is_valid,
        'message': result.message
    })


if __name__ == '__main__':
    app.run(debug=True)
