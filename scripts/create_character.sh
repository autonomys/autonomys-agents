#!/bin/bash

# Check if character name is provided as argument
if [ $# -eq 0 ]; then
    echo "Please provide a character name"
    echo "Usage: ./setup_character.sh your_character_name"
    exit 1
fi

CHARACTER_NAME=$1

# Check if target directory already exists
if [ -d "$CHARACTER_NAME" ]; then
    echo "Error: Directory $CHARACTER_NAME already exists"
    exit 1
fi

# Copy the example directory
echo "Copying character.example to $CHARACTER_NAME..."
cp -r config/character.example config/"$CHARACTER_NAME"

# Change into the new directory
cd config/"$CHARACTER_NAME" || exit

# Rename the files
echo "Renaming configuration files..."
mv .env.example .env
mv character.example.yaml "$CHARACTER_NAME.yaml"
mv config.example.yaml config.yaml

echo "Setup complete! Your new character directory '$CHARACTER_NAME' is ready."