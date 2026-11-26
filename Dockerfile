FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 PYTHONUTF8=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /srv/backend

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app app
COPY frontend /srv/frontend
RUN useradd --system --create-home tsport && install -d -o tsport -g tsport /srv/backend/.runtime
USER tsport

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
