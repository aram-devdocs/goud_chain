# Jupyter Notebook Environment for Goud Chain API Testing
FROM jupyter/scipy-notebook:latest

# Switch to root to install system dependencies
USER root

# Install any additional system packages if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Switch back to jovyan user
USER ${NB_UID}

# Copy requirements and install Python dependencies
COPY requirements.txt /tmp/
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Set working directory
WORKDIR /home/jovyan/work

# Enable Jupyter Lab by default
ENV JUPYTER_ENABLE_LAB=yes

# Expose Jupyter port
EXPOSE 8888

# Start Jupyter Lab
CMD ["start-notebook.sh", "--NotebookApp.token=''", "--NotebookApp.password=''"]
