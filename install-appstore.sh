#!/bin/bash

echo "Installing Camcookie Appstore..."

# Detect home folder
HOME_DIR="$HOME"

# Download latest Appstore
wget https://camcookie876.github.io/camcookie-appstore.py -O "$HOME_DIR/camcookie-appstore.py"

# Make executable
chmod +x "$HOME_DIR/camcookie-appstore.py"

# Remove old desktop icon if it exists
if [ -f "$HOME_DIR/Desktop/Camcookie-Appstore.desktop" ]; then
    rm "$HOME_DIR/Desktop/Camcookie-Appstore.desktop"
fi

# Create menu entry
mkdir -p "$HOME_DIR/.local/share/applications"

cat > "$HOME_DIR/.local/share/applications/camcookie-appstore.desktop" << EOF
[Desktop Entry]
Name=Camcookie Appstore
Comment=Install and manage Camcookie OS apps
Exec=python3 $HOME_DIR/camcookie-appstore.py
Icon=software-store
Terminal=false
Type=Application
Categories=Utility;Accessories;
EOF

# Make menu entry executable
chmod +x "$HOME_DIR/.local/share/applications/camcookie-appstore.desktop"

# Create installed version database if missing
if [ ! -f "$HOME_DIR/.camcookie_installed.json" ]; then
    echo "{}" > "$HOME_DIR/.camcookie_installed.json"
fi

# Refresh menu
update-desktop-database "$HOME_DIR/.local/share/applications" >/dev/null 2>&1

echo "Camcookie Appstore installed successfully!"
echo "You can now launch it from Menu → Accessories → Camcookie Appstore"