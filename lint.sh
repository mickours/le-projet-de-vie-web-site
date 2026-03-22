#!/bin/bash
set -e
echo "Running lint and format..."
cd backend
uv run ruff format .
uv run ruff check --fix .
echo "Linting passed!"
