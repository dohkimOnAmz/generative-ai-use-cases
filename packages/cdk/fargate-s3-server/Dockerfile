FROM public.ecr.aws/docker/library/python:3.13

WORKDIR /app

ENV UV_INSTALL_DIR=/usr/local/bin

RUN apt-get update -y
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

COPY pyproject.toml .python-version uv.lock ./

RUN uv sync

COPY app.py ./

CMD ["uv", "run", "app.py"]
