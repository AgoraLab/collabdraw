#!/usr/bin/env bash

cd `dirname $0`

rsync -avzr edge_server/* --exclude=__pycache__ --rsh "ssh -p 22 -i $HOME/.ssh/devops.pem" devops@139.224.34.246:~/collabdraw/edge_server;
ssh -o "StrictHostKeyChecking no" -p 20220 -i ~/.ssh/devops.pem devops@139.224.34.246 "~/collabdraw/edge_server/run_edge 5000 5001 5002"

rsync -avzr edge_server/* --exclude=__pycache__ --rsh "ssh -p 22 -i $HOME/.ssh/devops.pem" devops@119.9.92.228:~/collabdraw/edge_server;
ssh -o "StrictHostKeyChecking no" -p 20220 -i ~/.ssh/devops.pem devops@119.9.92.228 "~/collabdraw/edge_server/run_edge 5000 5001 5002"

rsync -avzr edge_server/* --exclude=__pycache__ --rsh "ssh -p 22 -i $HOME/.ssh/devops.pem" devops@8.37.238.42:~/collabdraw/edge_server;
ssh -o "StrictHostKeyChecking no" -p 20220 -i ~/.ssh/devops.pem devops@8.37.238.42 "~/collabdraw/edge_server/run_edge 5000 5001 5002"
