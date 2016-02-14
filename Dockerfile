FROM puffsun/collabdraw:v2
ADD . /collabdraw
WORKDIR /collabdraw
RUN pip3 install virtualenv
RUN virtualenv venv
