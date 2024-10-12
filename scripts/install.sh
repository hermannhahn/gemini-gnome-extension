sudo apt update
sudo apt install curl -y
sudo apt install python3 -y
sudo apt install notify-send -y
sudo apt install sox -y
git clone https://github.com/hermannhahn/gemini-gnome-extension.git
cd gemini-gnome-extension
npm install
npm run build:install

