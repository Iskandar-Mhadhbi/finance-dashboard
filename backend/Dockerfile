FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Pre-download FastEmbed model at build time
RUN python -c "from langchain_community.embeddings.fastembed import FastEmbedEmbeddings; FastEmbedEmbeddings(model_name='BAAI/bge-small-en-v1.5')"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]