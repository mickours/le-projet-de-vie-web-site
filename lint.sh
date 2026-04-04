#!/bin/bash
set -e
echo "Running lint, format and type checking..."
cd backend
uv run ruff format .
uv run ruff check --fix .
uv run mypy core/ adventure/
echo "All checks passed!"
