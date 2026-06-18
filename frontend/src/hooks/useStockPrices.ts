import { useEffect, useRef, useState } from 'react';

interface PriceUpdate {
  price: number;
  change: number;
  change_percent: number;
}

export function useStockPrices(enabled: boolean) {
  const [prices, setPrices] = useState<Record<string, PriceUpdate>>({});
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/prices?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as { prices: Record<string, PriceUpdate> };
        if (data.prices) {
          setPrices(data.prices);
        }
      } catch {
        console.error('Failed to parse WebSocket message');
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [enabled]);

  return { prices, connected };
}