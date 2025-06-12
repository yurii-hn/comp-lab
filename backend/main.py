from flask import Flask, Response, jsonify, request
from flask_cors import CORS

from classes.common.error_response import ErrorResponse
from classes.optimal_control.request_body import OptimalControlRequestBody
from classes.optimal_control.success_response import OptimalControlSuccessResponse
from classes.parameters_identification.request_body import PIRequestBody
from classes.parameters_identification.success_response import PISuccessResponse
from classes.simulation.request_body import SimulationRequestBody
from classes.simulation.success_response import SimulationSuccessResponse
from classes.validate_expression.validation_request_body import ValidationRequestBody
from classes.validate_expression.validation_response import ValidationResponse
from middleware.optimal_control import optimal_control
from middleware.parameters_identification import parameters_identification
from middleware.simulation import simulation
from middleware.validate_expression import validate_expression

app: Flask = Flask(__name__)

CORS(app)


@app.route("/simulate", methods=["POST"])
def simulate_endpoint() -> Response:
    body: SimulationRequestBody = request.get_json()

    result: SimulationSuccessResponse | ErrorResponse = simulation(
        body["parameters"], body["model"]
    )

    return jsonify(result)


@app.route("/optimal-control", methods=["POST"])
def optimal_control_endpoint() -> Response:
    body: OptimalControlRequestBody = request.get_json()

    result: OptimalControlSuccessResponse | ErrorResponse = optimal_control(
        body["parameters"],
        body["model"],
    )

    return jsonify(result)


@app.route("/parameters-identification", methods=["POST"])
def parameters_identification_endpoint():
    body: PIRequestBody = request.get_json()

    result: PISuccessResponse | ErrorResponse = parameters_identification(
        body["parameters"], body["model"]
    )

    return jsonify(result)


@app.route("/validate-expression", methods=["POST"])
def validate_expression_endpoint() -> Response:
    body: ValidationRequestBody = request.get_json()

    result: ValidationResponse = validate_expression(
        body["expression"], body["allowedSymbols"]
    )

    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)
