"""
Main module

This module contains the main application logic.
"""

from flask import Flask, request, jsonify

from simulate import simulate
from optimal_control import optimal_control
from validate_expression import validate_expression
from definitions import (
    IRawSimulationData,
    IRawOptimalControlData,
    ISimulationData,
    IOptimalControlData,
    ISimulationSuccessResponse,
    IOptimalControlSuccessResponse,
    IErrorResponse,
    IRawValidationPayload,
    IValidationPayload,
    IValidationResult
)

app: Flask = Flask(__name__)


@app.route('/simulate', methods=['POST'])
def simulate_endpoint():
    """
    Simulation endpoint

    This endpoint is used for basic model simulation
    """

    raw_data: IRawSimulationData = request.get_json()

    simulation_data: ISimulationData = ISimulationData(*raw_data.values())

    result: (
        ISimulationSuccessResponse |
        IErrorResponse
    ) = simulate(simulation_data)

    return jsonify(result)


@app.route('/optimal-control', methods=['POST'])
def optimal_control_endpoint():
    """
    Optimal control endpoint

    This endpoint is used for solving the optimal control problem
    """

    raw_data: IRawOptimalControlData = request.get_json()

    data: IOptimalControlData = IOptimalControlData(*raw_data.values())

    result: (
        IOptimalControlSuccessResponse |
        IErrorResponse
    ) = optimal_control(data)

    return jsonify(result)


@app.route('/validate-expression', methods=['POST'])
def validate_expression_endpoint():
    """
    Expression validation endpoint

    This endpoint is used for validating the expressions
    """

    raw_data: IRawValidationPayload = request.get_json()

    data: IValidationPayload = IValidationPayload(*raw_data.values())

    result: IValidationResult = validate_expression(data)

    return jsonify({
        'isValid': result.is_valid,
        'message': result.message
    })


if __name__ == '__main__':
    app.run(debug=True)
