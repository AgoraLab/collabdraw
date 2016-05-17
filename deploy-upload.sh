#!/usr/bin/env bash

cd `dirname $0`

rsync -avzr  upload_server/*  --exclude=__pycache__  --rsh "ssh -p 22 -i $HOME/.ssh/devops.pem" devops@119.9.92.228:~/collabdraw/upload_server;
ssh -o "StrictHostKeyChecking no" -p 20220 -i ~/.ssh/devops.pem devops@119.9.92.228 "~/collabdraw/upload_server/run_upload"
