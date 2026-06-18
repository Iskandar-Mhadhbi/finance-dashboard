import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as stocksApi from '../api/stocks';
import * as ragApi from '../api/rag';
import { StockChart } from '../components/StockChart';
import { DashboardHeader } from '../components/DashboardHeader';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

export function StockDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();

  // 1. REPLACED LOCAL STATE WITH TANSTACK QUERY
  const { 
    data: quote, 
    isLoading: quoteLoading, 
    error: quoteError 
  } = useQuery({
    queryKey: ['quote', symbol],
    queryFn: () => stocksApi.getQuote(symbol!),
    enabled: !!symbol, // Only fetch if symbol is present in the URL
    staleTime: 30_000,  // Keep data fresh for 30 seconds
  });

  // Chat/RAG States (These are UI-driven, so simple useState is still perfect here)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [fetchingNews, setFetchingNews] = useState(false);
  const [newsIndexed, setNewsIndexed] = useState<number | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Keep chat scrolled to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFetchNews = async () => {
    if (!symbol) return;
    setFetchingNews(true);
    try {
      const res = await ragApi.fetchNews(symbol);
      setNewsIndexed(res.articles_indexed);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `✅ Indexed ${res.articles_indexed} articles for ${symbol}. You can now ask questions about this stock.`,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: '❌ Failed to fetch news. Please try again.' },
      ]);
    } finally {
      setFetchingNews(false);
    }
  };

  const handleAsk = async () => {
    if (!symbol || !question.trim()) return;
    const userQuestion = question.trim();
    setQuestion('');
    setMessages((prev) => [...prev, { role: 'user', text: userQuestion }]);
    setChatLoading(true);
    try {
      const res = await ragApi.askQuestion(symbol, userQuestion);
      setMessages((prev) => [...prev, { role: 'ai', text: res.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: '❌ Failed to get an answer. Please try again.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const isPositive = quote && quote.change >= 0;

  return (
    <div className="min-h-screen bg-linear-to-r from-[var(--bg-secondary)] via-[var(--accent)]/10 to-[var(--bg-primary) ] transition-colors duration-200">
      <DashboardHeader />

      <main className="max-w-5xl mx-auto px-8 py-8 space-y-6">

        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm flex items-center gap-1 transition-colors duration-200 bg-transparent border-0 cursor-pointer"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          ← Back to Dashboard
        </button>

        {/* Quote Card */}
        {quoteLoading && <p style={{ color: 'var(--text-secondary)' }}>Loading quote...</p>}
        {quoteError && <p className="text-red-500">Failed to load quote data.</p>}
        
        {quote && (
          <div 
            className="rounded-xl shadow-sm p-6 transition-colors duration-200" 
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{quote.symbol}</h1>
                <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{quote.name}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  ${quote.price.toFixed(2)}
                </p>
                <p className={`text-sm font-medium mt-1 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({quote.change_percent.toFixed(2)}%)
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span>Prev. Close: <strong style={{ color: 'var(--text-secondary)' }}>${quote.previous_close.toFixed(2)}</strong></span>
              <span>Currency: <strong style={{ color: 'var(--text-secondary)' }}>{quote.currency}</strong></span>
            </div>
          </div>
        )}

        {/* Price Chart */}
        {symbol && (
          <div 
            className="rounded-xl shadow-sm p-6 transition-colors duration-200" 
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Price History</h2>
            <StockChart symbol={symbol} />
          </div>
        )}

        {/* RAG Chat */}
        <div 
          className="rounded-xl shadow-sm p-6 space-y-4 transition-colors duration-200" 
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>AI News Assistant</h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Ask questions about {symbol} based on latest news
              </p>
            </div>
            <button
              onClick={handleFetchNews}
              disabled={fetchingNews}
              className="px-4 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors duration-200"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {fetchingNews ? 'Fetching...' : newsIndexed ? '↺ Refresh News' : 'Fetch News'}
            </button>
          </div>

          {/* Chat messages box */}
          <div 
            className="h-72 overflow-y-auto space-y-3 rounded-lg p-4 transition-colors duration-200" 
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            {messages.length === 0 && (
              <p className="text-sm text-center mt-24" style={{ color: 'var(--text-muted)' }}>
                Click "Fetch News" to load the latest articles, then ask a question.
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'text-white rounded-br-none'
                      : 'rounded-bl-none shadow-sm'
                  }`}
                  style={
                    msg.role === 'user'
                      ? { backgroundColor: 'var(--accent)' }
                      : { backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
                  }
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div 
                  className="rounded-xl rounded-bl-none px-4 py-2 text-sm shadow-sm"
                  style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                >
                  Thinking...
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input block */}
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleAsk()}
              placeholder={`Ask something about ${symbol}...`}
              disabled={chatLoading}
              className="flex-1 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
            <button
              onClick={() => void handleAsk()}
              disabled={chatLoading || !question.trim()}
              className="px-4 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors duration-200"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Ask
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}