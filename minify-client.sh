#!/usr/bin/env bash

cd client && ./enyo/tools/deploy.js -o ../public && cd -
cd public &&  cp -r lib ./js/ && cd -
