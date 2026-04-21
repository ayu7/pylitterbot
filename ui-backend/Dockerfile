FROM python:3.11-slim

WORKDIR /app

COPY ui-backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ui-backend/ .

EXPOSE 8000

CMD ["python", "main.py"]
