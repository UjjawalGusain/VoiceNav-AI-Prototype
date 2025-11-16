from flask import request, jsonify, Blueprint
import requests
import tempfile
import json
import logging

from backend.foreman_navigation_tool import ForemanPlannerAgent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cache agents per DAG URL
_agents = {}

def download_dag(dag_url: str) -> str:
    logger.info(f"Downloading DAG from {dag_url}...")
    resp = requests.get(dag_url, timeout=10)
    resp.raise_for_status()
    dag_data = resp.json()
    tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".json", prefix="dag_")
    with open(tmp_file.name, "w") as f:
        json.dump(dag_data, f, indent=2)
    logger.info(f"DAG saved to {tmp_file.name}")
    return tmp_file.name

def get_agent(dag_url: str) -> ForemanPlannerAgent:
    if dag_url in _agents:
        return _agents[dag_url]
    dag_path = download_dag(dag_url)
    agent = ForemanPlannerAgent(dag_file_path=dag_path)
    _agents[dag_url] = agent
    return agent

foreman_bp = Blueprint("foreman_bp", __name__)

@foreman_bp.route('/api/navigation/plan', methods=['POST'])
def plan_navigation():
    if not request.is_json:
        return jsonify({"status": "error", "error": "Expected JSON request"}), 400
    data = request.get_json()
    session_id = data.get("session_id")
    dag_url = data.get("dag_url")
    query = data.get("query")
    currentPath = data.get("currentPath")
    if not session_id or not dag_url or not query or not currentPath:
        return jsonify({"status": "error", "error": "Missing session_id, dag_url, query, or currentPath"}), 400
    if not dag_url.startswith(("http://", "https://")):
        return jsonify({"status": "error", "error": "Invalid dag_url"}), 400

    try:
        agent = get_agent(dag_url)
        nav_output = agent.plan_route(query, session_id, currentPath)
        logger.info(nav_output)
        return jsonify({
            "status": "success",
            "session_id": session_id,
            "navigation_plan": {
                "route": [step.model_dump() for step in nav_output.route] if nav_output.route else None,
                "error": nav_output.error
            }
        })
    except Exception as e:
        logger.error(f"Error processing request: {e}", exc_info=True)
        return jsonify({"status": "error", "error": "Internal server error"}), 500

# @app.route("/api/session/<session_id>", methods=["DELETE"])
# def clear_session(session_id: str):
#     cleared_any = False
#     try:
#         for agent in _agents.values():
#             if hasattr(agent, "clear_session"):
#                 agent.clear_session(session_id)
#                 cleared_any = True
#         if cleared_any:
#             return jsonify({"status": "success", "message": f"Session {session_id} cleared."}), 200
#         return jsonify({"status": "error", "error": "Session not found or no clear method."}), 404
#     except Exception as e:
#         logger.error(f"Error clearing session: {e}", exc_info=True)
#         return jsonify({"status": "error", "error": "Internal server error"}), 500

# @app.route("/api/health", methods=["GET"])
# def health_check():
#     return jsonify({
#         "status": "healthy",
#         "agents_loaded": len(_agents),
#     }), 200
