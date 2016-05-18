#!/usr/bin/env bash
cd `dirname $0`
rsync -avzr ./center_server/* --exclude=__pycache__ --rsh "ssh -p 22 -i $HOME/.ssh/devops.pem" devops@119.9.92.228:~/collabdraw/center_server;
ssh -o "StrictHostKeyChecking no" -p 20220 -i ~/.ssh/devops.pem devops@119.9.92.228 "~/collabdraw/center_server/run_center"

rsync -avzr ./center_server/* --exclude=__pycache__ --exclude=*.pyc --rsh "ssh -p 22 -i $HOME/.ssh/devops.pem" devops@139.224.34.246:~/collabdraw/center_server;
ssh -o "StrictHostKeyChecking no" -p 20220 -i ~/.ssh/devops.pem devops@139.224.34.246 "~/collabdraw/center_server/run_center"
