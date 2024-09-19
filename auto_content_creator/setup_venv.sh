#!/bin/bash

# Create a virtual environment
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install requirements
pip install -r requirements.txt

# Install additional requirements for the API
pip install fastapi uvicorn

echo "Virtual environment setup complete. Activate it with 'source venv/bin/activate'"