# backend/Dockerfile

FROM python:3.10-slim

WORKDIR /app

# Copy the requirements file and install dependencies
COPY ./backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire Django project into the container
COPY ./backend /app

# Command to run Gunicorn server with the correct Django app
CMD ["gunicorn", "--workers", "3", "--bind", "0.0.0.0:8000", "studentmove.wsgi:application"]
