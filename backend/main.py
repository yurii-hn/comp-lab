"""
Main module

This module contains the main application logic.
"""

from flask import Flask, request, jsonify

from simulate import simulate
from optimal_control import optimal_control
from validate_expression import validate_expression
from definitions import (
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
    IOptimalControlRequestPayload
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
            raw_data['payload']['compartments']
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
            raw_data['parameters']['interventionLowerBoundary']
        ),
        IOptimalControlRequestPayload(
            raw_data['payload']['compartments'],
            raw_data['payload']['interventions']
        )
    )

    result: IOptimalControlResponse = optimal_control(data)

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
