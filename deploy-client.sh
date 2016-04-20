#!/usr/bin/env bash

cd `dirname $0`

sh minify-client.sh

rsync -avzr ./public --exclude=venv --exclude=__pycache__ --exclude=output_5000.log --rsh "ssh -p 22 -i $HOME/.ssh/devops.pem" devops@119.9.75.121:~/collabdraw;
rsync -avzr ./public --exclude=venv --exclude=__pycache__ --exclude=output_5000.log --rsh "ssh -p 22 -i $HOME/.ssh/devops.pem" devops@14.152.50.28:~/collabdraw;
