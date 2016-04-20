#!/usr/bin/env bash

cd `dirname $0`

rsync -avzr ./center --exclude=venv --exclude=__pycache__ --exclude=output_5000.log --rsh "ssh -p 22 -i $HOME/.ssh/devops.pem" devops@119.9.92.228:~/collabdraw;
ssh -o "StrictHostKeyChecking no" -p 20220 -i ~/.ssh/devops.pem devops@119.9.92.228 "~/collabdraw/center/run"

