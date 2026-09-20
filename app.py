"""
Flask Application Server for NeuroSense-WSN v2.
Serves static frontend assets and REST API endpoints on http://localhost:5000.
"""

import os
from flask import Flask, send_from_directory
from src.api import api_bp


def create_app() -> Flask:
    """Initialize and configure the Flask web application."""
    app = Flask(__name__, static_folder="web", static_url_path="")
    app.config["JSON_SORT_KEYS"] = False
    app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0

    # Enable CORS and disable caching for reliable updates
    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response

    # Register API blueprint
    app.register_blueprint(api_bp)

    # Serve index.html at root
    @app.route("/")
    def index():
        return send_from_directory("web", "index.html")

    return app


if __name__ == "__main__":
    app = create_app()
    requested_port = int(os.environ.get("PORT", 5000))
    for port in [requested_port, 5001, 8000, 8080]:
        try:
            print(f"\n=======================================================")
            print(f" NeuroSense-WSN v2 Laboratory Online")
            print(f" Access UI at: http://localhost:{port}")
            print(f"=======================================================\n")
            app.run(host="0.0.0.0", port=port, debug=False)
            break
        except OSError:
            print(f"Port {port} in use, attempting next port...")
