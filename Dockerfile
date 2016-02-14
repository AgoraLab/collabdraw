FROM puffsun/collabdraw:v3
ADD . /collabdraw
WORKDIR /collabdraw
RUN pip3 install virtualenv
RUN virtualenv venv
RUN . venv/bin/activate
RUN pip3 install -r requirements.txt
