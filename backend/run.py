#!/usr/bin/env python3
"""Script para ejecutar el servidor FastAPI"""
import uvicorn
import sys
import logging

logging.basicConfig(level=logging.INFO)

if __name__ == "__main__":
    try:
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
