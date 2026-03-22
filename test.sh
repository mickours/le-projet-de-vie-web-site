#!/bin/bash
set -e
echo "Running tests..."
cd backend
export PYTHONPATH=$PYTHONPATH:$(pwd)/src
uv run pytest src/tests
echo "Tests passed!"
