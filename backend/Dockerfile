FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

# Dependencias con versión exacta y hash; solo wheels, sin ejecutar setup.py
COPY requirements.lock .
RUN pip install --no-cache-dir --only-binary :all: --require-hashes -r requirements.lock

# Solo el código necesario (nada de .env, tests de terceros ni ficheros locales)
COPY manage.py ./
COPY backend ./backend
COPY api ./api
COPY data/seed ./data/seed

# Usuario sin privilegios; solo puede escribir en data/
RUN useradd --uid 10001 --create-home bdp && chown -R 10001 /app/data
USER 10001

EXPOSE 8000
# Sin base de datos: los datos viven en data/runtime (JSON), creados desde data/seed.
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
