FROM puffsun/collabdraw:v4
ADD . /collabdraw
WORKDIR /collabdraw
RUN /root/.pyenv/shims/pip install -r requirements.txt
