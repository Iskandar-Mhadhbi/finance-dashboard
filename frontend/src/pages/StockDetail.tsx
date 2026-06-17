import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as stocksApi from '../api/stocks';
import * as ragApi from '../api/rag';
import type { StockQuote } from '../api/stocks';
import { StockChart } from '../components/StockChart';
import { DashboardHeader } from '../components/DashboardHeader';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

export function StockDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();

  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [fetchingNews, setFetchingNews] = useState(false);
  const [newsIndexed, setNewsIndexed] = useState<number | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!symbol) return;
    const loadQuote = async () => {
      try {
        setQuoteLoading(true);
        const data = await stocksApi.getQuote(symbol);
        setQuote(data);
      } catch {
        setQuoteError('Failed to load quote.');
      } finally {
        setQuoteLoading(false);
      }
    };
    void loadQuote();
  }, [symbol]);

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
    <div className="min-h-screen bg-slate-100">
      <DashboardHeader />

      <main className="max-w-5xl mx-auto px-8 py-8 space-y-6">

        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
        >
          ← Back to Dashboard
        </button>

        {/* Quote Card */}
        {quoteLoading && <p className="text-slate-500">Loading quote...</p>}
        {quoteError && <p className="text-red-500">{quoteError}</p>}
        {quote && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">{quote.symbol}</h1>
                <p className="text-slate-500 mt-1">{quote.name}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-slate-800">
                  ${quote.price.toFixed(2)}
                </p>
                <p className={`text-sm font-medium mt-1 ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({quote.change_percent.toFixed(2)}%)
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-6 text-sm text-slate-500">
              <span>Prev. Close: <strong className="text-slate-700">${quote.previous_close.toFixed(2)}</strong></span>
              <span>Currency: <strong className="text-slate-700">{quote.currency}</strong></span>
            </div>
          </div>
        )}

        {/* Price Chart */}
        {symbol && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Price History</h2>
            <StockChart symbol={symbol} />
          </div>
        )}

        {/* RAG Chat */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">AI News Assistant</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Ask questions about {symbol} based on latest news
              </p>
            </div>
            <button
              onClick={handleFetchNews}
              disabled={fetchingNews}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {fetchingNews ? 'Fetching...' : newsIndexed ? '↺ Refresh News' : 'Fetch News'}
            </button>
          </div>

          {/* Chat messages */}
          <div className="h-72 overflow-y-auto space-y-3 border border-slate-100 rounded-lg p-4 bg-slate-50">
            {messages.length === 0 && (
              <p className="text-slate-400 text-sm text-center mt-24">
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
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-xl rounded-bl-none px-4 py-2 text-sm text-slate-400 shadow-sm">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleAsk()}
              placeholder={`Ask something about ${symbol}...`}
              disabled={chatLoading}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={() => void handleAsk()}
              disabled={chatLoading || !question.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Ask
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}