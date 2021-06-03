FROM python:3
ENV PYTHONUNBUFFERED=1
WORKDIR /daniil_project
COPY requirements.txt /daniil_project/
RUN pip install -r requirements.txt
COPY . /daniil_project/