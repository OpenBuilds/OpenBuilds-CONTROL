#!/bin/bash

echo "---------------------------------------------------"
echo "[STARTING]  OPENBUILDS-CONTROL INSTALL SCRIPT"
echo "            Updated for 2025 - Security & Performance"
echo "            Please wait for each step to complete."
echo "---------------------------------------------------"

# Check if running on supported ARM64 architecture
ARCH=$(uname -m)
if [[ "$ARCH" != "aarch64" ]]; then
    echo "❌ This script requires ARM64 (aarch64) architecture"
    echo "   Current architecture: $ARCH"
    exit 1
fi

echo "(1/12) Updating Repositories..."
sudo apt-get update

echo "(2/12) Upgrading RaspiOS..."
sudo apt-get upgrade -y

echo "(3/12) Installing essential build tools and libraries..."
sudo apt-get install -y \
    build-essential \
    git \
    curl \
    wget \
    python3 \
    python3-pip \
    libnss3-dev \
    libatk-bridge2.0-dev \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2-dev \
    libgtk-3-dev \
    libgconf-2-4

echo "(4/12) Installing desktop environment components..."
sudo apt-get install -y lightdm tightvncserver xrdp

echo "(5/12) Installing NVM (Node Version Manager)..."
# Remove any existing NVM installation
rm -rf ~/.nvm
# Install latest NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Load NVM immediately
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

echo "(6/12) Installing latest LTS Node.js..."
nvm install --lts
nvm use --lts
nvm alias default node

echo "(7/12) Updating npm to latest version..."
npm install -g npm@latest

echo "(8/12) Installing global dependencies..."
npm install -g electron-rebuild@latest

echo "(9/12) Downloading OpenBuilds-CONTROL source code..."
cd ~
if [ -d "OpenBuilds-CONTROL" ]; then
    echo "   Removing existing installation..."
    rm -rf OpenBuilds-CONTROL
fi
git clone https://github.com/OpenBuilds/OpenBuilds-CONTROL.git
cd ~/OpenBuilds-CONTROL

echo "(10/12) Updating package.json for security..."
# Create a temporary package.json with updated dependencies
cat > package-updates.json << 'EOF'
{
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.13.3",
    "electron-rebuild": "^3.2.9"
  },
  "dependencies": {
    "serialport": "^12.0.0",
    "socket.io": "^4.7.5",
    "express": "^4.19.2",
    "electron-updater": "^6.1.8"
  }
}
EOF

# Merge with existing package.json using Node.js
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const updates = JSON.parse(fs.readFileSync('package-updates.json', 'utf8'));

// Update dependencies
Object.assign(pkg.dependencies, updates.dependencies);
Object.assign(pkg.devDependencies, updates.devDependencies);

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ Package.json updated with latest secure versions');
"

rm package-updates.json

echo "(11/12) Installing and building OpenBuilds-CONTROL..."
# Increase memory limit for Node.js
export NODE_OPTIONS="--max-old-space-size=4096"

# Install dependencies
npm install

# Audit and fix security vulnerabilities
echo "   Checking for security vulnerabilities..."
npm audit fix --force

# Rebuild native modules for ARM64
npm run rebuild || ./node_modules/.bin/electron-rebuild

echo "(12/12) Creating desktop shortcuts..."
# Create improved desktop shortcut
cat > ~/Desktop/OpenBuilds-CONTROL.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=OpenBuilds CONTROL
Comment=OpenBuilds CNC Control Software
Exec=/home/pi/.nvm/versions/node/$(nvm current)/bin/node /home/pi/OpenBuilds-CONTROL/index.js
Icon=/home/pi/OpenBuilds-CONTROL/app/icon.png
Terminal=false
StartupNotify=true
Categories=Graphics;Engineering;
EOF

chmod +x ~/Desktop/OpenBuilds-CONTROL.desktop

# Create menu entry
sudo cp ~/Desktop/OpenBuilds-CONTROL.desktop /usr/share/applications/

# Create startup script
cat > ~/OpenBuilds-CONTROL/start.sh << 'EOF'
#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd ~/OpenBuilds-CONTROL
node index.js
EOF

chmod +x ~/OpenBuilds-CONTROL/start.sh

echo "---------------------------------------------------"
echo "✅ [COMPLETE] Installation Complete!"
echo ""
echo "🚀 To start OpenBuilds CONTROL:"
echo "   • Double-click desktop icon, or"
echo "   • Run: ~/OpenBuilds-CONTROL/start.sh"
echo "   • Or access via web: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "🔧 Troubleshooting:"
echo "   • Check logs: tail -f ~/.openbuilds-control.log"
echo "   • Update: cd ~/OpenBuilds-CONTROL && git pull && npm update"
echo "   • Security audit: cd ~/OpenBuilds-CONTROL && npm audit"
echo ""
echo "📚 Next steps:"
echo "   1. Connect your BlackBox via USB"
echo "   2. Launch OpenBuilds CONTROL"
echo "   3. Select your controller in the connection dropdown"
echo "---------------------------------------------------"
