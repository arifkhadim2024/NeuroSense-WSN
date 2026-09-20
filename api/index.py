"""
Vercel Serverless Function Entry Point for NeuroSense-WSN v2.
Exports Flask WSGI application instance for @vercel/python runtime.
"""

import os
import sys

# Ensure repository root is in sys.path so src.* and app.py can be imported
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app import create_app

# WSGI application callable for Vercel Python runtime
app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
