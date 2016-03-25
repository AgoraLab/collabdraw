FROM puffsun/collabdraw:v5
ADD . /collabdraw
WORKDIR /collabdraw
RUN /root/.pyenv/shims/pip install -r requirements.txt
