#!/bin/bash

echo "Installing Camcookie Appstore..."

# Download latest Appstore
wget https://camcookie876.github.io/camcookie-appstore.py -O "$HOME/camcookie-appstore.py"

# Make executable
chmod +x "$HOME/camcookie-appstore.py"

# Create desktop shortcut
cat > "$HOME/Desktop/Camcookie-Appstore.desktop" << 'EOF'
[Desktop Entry]
Name=Camcookie Appstore
Exec=python3 $HOME/camcookie-appstore.py
Type=Application
Icon=software-store
Terminal=false
EOF

# Make shortcut executable
chmod +x "$HOME/Desktop/Camcookie-Appstore.desktop"

# Create installed version database if missing
if [ ! -f "$HOME/.camcookie_installed.json" ]; then
    echo "{}" > "$HOME/.camcookie_installed.json"
fi

echo "Camcookie Appstore installed successfully!"
echo "You can now launch it from your desktop."