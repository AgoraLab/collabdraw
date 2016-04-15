#!/bin/bash
sudo add-apt-repository -y ppa:fkrull/deadsnakes
sudo apt-get update
sudo apt-get install -y python3.5 poppler-utils imagemagick ffmpeg git pkg-config libcairo2-dev libpython3.5-dev libffi-dev
wget https://bootstrap.pypa.io/get-pip.py
sudo python3.5 get-pip.py
sudo pip3.5 install virtualenv
virtualenv venv
source venv/bin/activate
pip install -r requirements.txt
