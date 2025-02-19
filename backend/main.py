"""Main Module"""

from core.classes.common.error_response import ErrorResponse
from core.classes.common.validation_request_body import ValidationRequestBody
from core.classes.common.validation_response import ValidationResponse
from core.classes.optimal_control.request_body import OptimalControlRequestBody
from core.classes.optimal_control.success_response import \
    OptimalControlSuccessResponse
from core.classes.parameters_identification.request_body import PIRequestBody
from core.classes.parameters_identification.success_response import \
    PISuccessResponse
from core.classes.simulation.request_body import SimulationRequestBody
from core.classes.simulation.success_response import SimulationSuccessResponse
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from middleware.optimal_control import optimal_control
from middleware.parameters_identification import parameters_identification
from middleware.simulate import simulate
from middleware.validate_expression import validate_expression

app: Flask = Flask(__name__)
CORS(app)


@app.route("/simulate", methods=["POST"])
def simulate_endpoint() -> Response:
    """Simulation endpoint"""

    body: SimulationRequestBody = SimulationRequestBody(request.get_json())

    result: SimulationSuccessResponse | ErrorResponse = simulate(
        body.parameters, body.model
    )

    return jsonify(result.definition)


@app.route("/optimal-control", methods=["POST"])
def optimal_control_endpoint() -> Response:
    """Optimal Control endpoint"""

    body: OptimalControlRequestBody = OptimalControlRequestBody(request.get_json())

    result: OptimalControlSuccessResponse | ErrorResponse = optimal_control(
        body.parameters, body.model
    )

    return jsonify(result.definition)


@app.route("/parameters-identification", methods=["POST"])
def parameters_identification_endpoint():
    """Parameters identification endpoint"""

    body: PIRequestBody = PIRequestBody(request.get_json())

    result: PISuccessResponse | ErrorResponse = parameters_identification(
        body.parameters, body.model
    )

    return jsonify(result.definition)


@app.route("/validate-expression", methods=["POST"])
def validate_expression_endpoint() -> Response:
    """Expression validation endpoint"""

    body: ValidationRequestBody = ValidationRequestBody(request.get_json())

    result: ValidationResponse = validate_expression(
        body.expression, body.allowed_symbols
    )

    return jsonify(result.definition)


if __name__ == "__main__":
    app.run(debug=True)
