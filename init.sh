#!/bin/bash
sudo apt-get install -y python-software-properties software-properties-common
sudo add-apt-repository -y ppa:fkrull/deadsnakes
sudo apt-get update
#sudo apt-get install -y ffmpeg 
sudo apt-get install -y python3.5 poppler-utils imagemagick git pkg-config libcairo2-dev libpython3.5-dev libffi-dev libtiff4-dev libjpeg8-dev zlib1g-dev libfreetype6-dev liblcms2-dev libwebp-dev tcl8.5-dev tk8.5-dev
wget https://bootstrap.pypa.io/get-pip.py
sudo python3.5 get-pip.py
sudo pip3.5 install virtualenv
virtualenv venv
source venv/bin/activate
pip install -r requirements.txt
