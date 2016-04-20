#!/bin/bash

cd `dirname $0`

sh deploy-client.sh

sh deploy-center.sh

sh deploy-edge.sh
