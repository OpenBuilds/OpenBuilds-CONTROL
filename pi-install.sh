echo "---------------------------------------------------"
echo "[STARTING]  OPENBUILDS-CONTROL INSTALL SCRIPT:     "
echo "            Please wait for each step to complete. "
echo "---------------------------------------------------"
echo "(1/10) Updating Repositories..."
sudo apt-get update
echo "(2/10) Upgrading RaspiOS..."
sudo apt-get upgrade -y
echo "(3/10) Installing remote desktop (TightVNC and XRDP)..."
sudo apt install -y tightvncserver
sudo apt install -y xrdp
echo "(4/10) Installing GIT..."
sudo apt-get install -y git
echo "(5/10) Installing NodeJS 19.x..."
curl -sL https://deb.nodesource.com/setup_19.x | sudo -E bash -
sudo apt-get install -y nodejs
echo "(6/10) Updating npm..."
sudo npm install -g npm@latest
echo "(7/10) Downloading OpenBuilds-CONTROL source code..."
cd ~; git clone https://github.com/OpenBuilds/OpenBuilds-CONTROL.git
cd ~/OpenBuilds-CONTROL
echo "(8/10) Installing OpenBuilds-CONTROL dependencies..."
chmod 777 ~/.config
npm install
echo "(9/10) Recompiling OpenBuilds-CONTROL dependencies..."
npm rebuild
npm install electron-rebuild
~/OpenBuilds-CONTROL/node_modules/.bin/electron-rebuild
echo "(10/10) Creating Menu and Desktop Shortcuts..."
cp ~/OpenBuilds-CONTROL/pi-shortcut.desktop ~/Desktop/OpenBuilds-CONTROL.desktop
sudo cp ~/OpenBuilds-CONTROL/pi-shortcut.desktop /usr/share/applications/OpenBuilds-CONTROL.desktop
echo "---------------------------------------------------"
echo "[COMPLETE] Install Complete!  Thank you!"
echo "---------------------------------------------------"
