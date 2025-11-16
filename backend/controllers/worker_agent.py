from flask import request, jsonify, Blueprint
import logging

from backend.worker_navigation_tool import WorkerAgent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cache agents per DAG URL
workers = {}

worker_bp = Blueprint("worker_bp", __name__)

@worker_bp.route('/api/navigation/worker', methods=['POST'])
def execute_instruction():
    """
    Endpoint: /api/worker/execute
    Accepts a JSON body:
    {
        "session_id": "user123",
        "instruction": { ... },
        "dom_snapshot": "<html>...</html>"
    }
    Returns:
    {
        "execution": {
            "action": "...",
            "target": "...",
            "value": "..."
        }
    }
    """
    data = request.get_json(force=True)

    session_id = data.get("session_id")
    instruction = data.get("instruction")
    dom_snapshot = data.get("dom_snapshot")

    if not all([session_id, instruction, dom_snapshot]):
        return jsonify({"error": "Missing required fields (session_id, instruction, dom_snapshot)"}), 400

    # Reuse existing worker for session or create a new one
    if session_id not in workers:
        logger.info(f"Creating new worker for session: {session_id}")
        workers[session_id] = WorkerAgent(session_id=session_id)

    worker = workers[session_id]

    try:
        execution_obj = worker.receive_instruction(instruction, dom_snapshot)
        logger.info(execution_obj)
        return jsonify({"execution": execution_obj.model_dump()})
    except Exception as e:
        logger.exception("Error while generating execution object")
        return jsonify({"error": str(e)}), 500

