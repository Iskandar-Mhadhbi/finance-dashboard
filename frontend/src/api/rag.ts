import api from './client';

export async function fetchNews(symbol: string): Promise<{ articles_indexed: number }> {
  const res = await api.post(`/rag/${symbol}/fetch`);
  return res.data;
}

export async function askQuestion(
  symbol: string,
  question: string,
): Promise<{ symbol: string; question: string; answer: string }> {
  const res = await api.post(`/rag/${symbol}/ask`, { question });
  return res.data;
}