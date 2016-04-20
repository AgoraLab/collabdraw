#!/bin/bash
cd `dirname $0`
rsync -avzr ./public --exclude=venv --exclude=__pycache__ --exclude=output_5000.log --rsh "ssh -p 22 -i $HOME/.ssh/devops.pem" devops@119.9.75.121:~/collabdraw;
rsync -avzr ./center --exclude=venv --exclude=__pycache__ --exclude=output_5000.log --rsh "ssh -p 22 -i $HOME/.ssh/devops.pem" devops@119.9.92.228:~/collabdraw;
ssh -o "StrictHostKeyChecking no" -p 20220 -i ~/.ssh/devops.pem devops@119.9.92.228 "~/collabdraw/center/run"
#rsync -avzr ./agorabeckon* ./*.py ./run ./init.sh ./requirements.txt   ./org --exclude=venv --exclude=__pycache__ --exclude=output_5000.log --rsh "ssh -p 22 -i $HOME/.ssh/devops.pem" devops@14.152.50.28:~/collabdraw;
rsync -avzr ./agorabeckon* ./*.py ./run ./init.sh ./requirements.txt   ./org --exclude=venv --exclude=__pycache__ --exclude=output_5000.log --rsh "ssh -p 22 -i $HOME/.ssh/devops.pem" devops@119.9.92.228:~/collabdraw;
ssh -o "StrictHostKeyChecking no" -p 20220 -i ~/.ssh/devops.pem devops@119.9.92.228 "~/collabdraw/run 5000 5001 5002"
rsync -avzr ./agorabeckon* ./*.py ./run ./init.sh ./requirements.txt  ./org --exclude=venv --exclude=__pycache__ --exclude=output_5000.log --rsh "ssh -p 22 -i $HOME/.ssh/devops.pem" devops@8.37.238.42:~/collabdraw;
ssh -o "StrictHostKeyChecking no" -p 20220 -i ~/.ssh/devops.pem devops@8.37.238.42 "~/collabdraw/run 5000 5001 5002"