from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
#from langchain_huggingface import HuggingFaceEmbeddings
from langchain_postgres.vectorstores import PGVector
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
import httpx
from pydantic import SecretStr
from app.core.config import settings
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings


# --- Connection string for pgvector ---
CONNECTION_STRING = (
    f"postgresql+psycopg2://{settings.db_user}:{settings.db_password}"
    f"@{settings.db_host}:{settings.db_port}/{settings.db_name}"
)

# --- Embedding model (runs locally, no API key needed) ---
embeddings = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")

# --- Groq LLM ---
llm = ChatGroq(
    api_key=SecretStr(settings.groq_api_key),
    model="llama-3.1-8b-instant",
)

# --- Text splitter ---
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)


async def fetch_marketaux_news(symbol: str) -> list[Document]:
    """Fetch news from Marketaux API."""
    url = "https://api.marketaux.com/v1/news/all"
    params = {
        "symbols": symbol,
        "filter_entities": "true",
        "language": "en",
        "api_token": settings.marketaux_api_key,
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
        articles = data.get("data", [])
        docs = []
        for article in articles:
            text = f"{article.get('title', '')}\n\n{article.get('description', '')}"
            docs.append(Document(
                page_content=text,
                metadata={
                    "symbol": symbol,
                    "url": article.get("url", ""),
                    "published_at": article.get("published_at", ""),
                    "source": article.get("source", ""),
                    "provider": "marketaux",
                },
            ))
        return docs
    except Exception as e:
        print(f"Marketaux fetch failed: {e}")
        return []


def fetch_yfinance_news(symbol: str) -> list[Document]:
    """Fetch news from yfinance."""
    try:
        import yfinance as yf
        ticker = yf.Ticker(symbol)
        articles = ticker.news or []
        docs = []
        for article in articles:
            content = article.get("content", {})
            title = content.get("title", "")
            summary = content.get("summary", "")
            text = f"{title}\n\n{summary}".strip()
            if not text:
                continue
            docs.append(Document(
                page_content=text,
                metadata={
                    "symbol": symbol,
                    "url": content.get("canonicalUrl", {}).get("url", ""),
                    "published_at": content.get("pubDate", ""),
                    "source": content.get("provider", {}).get("displayName", "Yahoo Finance"),
                    "provider": "yfinance",
                },
            ))
        return docs
    except Exception as e:
        print(f"yfinance fetch failed: {e}")
        return []


async def fetch_and_store_news(symbol: str) -> int:
    """Fetch news from both Marketaux and yfinance, embed and store in pgvector."""

    # Fetch from both sources concurrently
    import asyncio
    marketaux_docs, yfinance_docs = await asyncio.gather(
        fetch_marketaux_news(symbol),
        asyncio.to_thread(fetch_yfinance_news, symbol),
    )

    # Merge and deduplicate by URL
    seen_urls = set()
    all_docs = []
    for doc in marketaux_docs + yfinance_docs:
        url = doc.metadata.get("url", "")
        if url and url in seen_urls:
            continue
        seen_urls.add(url)
        all_docs.append(doc)

    if not all_docs:
        return 0

    # Split into chunks
    chunks = splitter.split_documents(all_docs)

    # Store in pgvector
    PGVector.from_documents(
    documents=chunks,
    embedding=embeddings,
    collection_name=f"news_{symbol.lower()}",
    connection=CONNECTION_STRING,
    pre_delete_collection=True,
    use_jsonb=True,
)

    return len(all_docs)

async def answer_question(symbol: str, question: str) -> str:
    """Retrieve relevant chunks from pgvector and answer with Groq."""

    vectorstore = PGVector(
    embeddings=embeddings,
    collection_name=f"news_{symbol.lower()}",
    connection=CONNECTION_STRING,
    use_jsonb=True,
)

    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
    relevant_docs = retriever.invoke(question)

    if not relevant_docs:
        return "I don't have enough recent news context to answer that. Try fetching news first."

    context = "\n\n".join([doc.page_content for doc in relevant_docs])

    prompt = ChatPromptTemplate.from_template("""
You are a financial analyst assistant. Answer the user's question based only on the news context provided below.
Be concise, factual, and cite the source where relevant.

Context:
{context}

Question: {question}

Answer:
""")

    chain = prompt | llm | StrOutputParser()
    return chain.invoke({"context": context, "question": question})