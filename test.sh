#!/bin/bash
set -e
echo "Running tests..."
cd backend
export DJANGO_SETTINGS_MODULE=core.settings
uv run python -m pytest core/ adventure/
echo "Tests passed!"
