#!/bin/bash -e

# ==============================================================================
# This script install dependencies and the extension.
# ==============================================================================

echo "Downloading extension..."
git clone https://github.com/hermannhahn/gemini-gnome-extension.git
cd gemini-gnome-extension
echo "Extension cloned."
echo "Installing dependencies..."
sudo apt update
sudo apt install curl -y
sudo apt install python3 -y
sudo apt install notify-send -y
sudo apt install sox -y
npm install
echo "Dependencies installed."
echo "Installing extension..."
npm run build:install
echo "Extension installed."
echo "Active Gemini Voice Assistant: https://extensions.gnome.org/local/"
exit 0
