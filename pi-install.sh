echo "---------------------------------------------------"
echo "[STARTING]  OPENBUILDS-CONTROL INSTALL SCRIPT:     "
echo "            Please wait for each step to complete. "
echo "---------------------------------------------------"
echo "(1/10) Updating Repositories..."
sudo apt-get update > /dev/null 2>&1
echo "(2/10) Upgrading RaspiOS..."
sudo apt-get upgrade -y > /dev/null 2>&1
echo "(3/10) Installing remote desktop (TightVNC and XRDP)..."
sudo apt install -y tightvncserver > /dev/null 2>&1
sudo apt install -y xrdp > /dev/null 2>&1
echo "(4/10) Installing GIT..."
sudo apt-get install -y git > /dev/null 2>&1
echo "(5/10) Installing NodeJS 12.x..."
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash - > /dev/null 2>&1
sudo apt-get install -y nodejs > /dev/null 2>&1
echo "(6/10) Updating npm..."
sudo npm install -g npm@latest  > /dev/null 2>&1
echo "(7/10) Downloading OpenBuilds-CONTROL source code..."
cd ~; git clone https://github.com/OpenBuilds/OpenBuilds-CONTROL.git > /dev/null 2>&1
cd ~/OpenBuilds-CONTROL > /dev/null 2>&1
echo "(8/10) Installing OpenBuilds-CONTROL dependencies..."
npm install > /dev/null 2>&1
echo "(9/10) Recompiling OpenBuilds-CONTROL dependencies..."
npm rebuild > /dev/null 2>&1
echo "(10/10) Creating Menu and Desktop Shortcuts..."
cp pi-shortcut.desktop ~/Desktop/OpenBuilds-CONTROL.desktop > /dev/null 2>&1
sudo cp pi-shortcut.desktop /usr/share/applications/OpenBuilds-CONTROL.desktop > /dev/null 2>&1
echo "---------------------------------------------------"
echo "[COMPLETE] Install Complete!  Thank you!"
echo "---------------------------------------------------"
