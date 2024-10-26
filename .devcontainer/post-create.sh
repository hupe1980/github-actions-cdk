#!/bin/bash

# Update the package list
sudo apt-get update 

# Install python3.11-venv and ensure pip is installed
sudo apt-get install -y python3.11-venv python3-build twine

# Install Node.js dependencies
npm install

