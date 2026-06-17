import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type ChartData
} from 'chart.js';
import * as stocksApi from '../api/stocks';
import type { StockHistoryPoint } from '../api/stocks';

// Register Chart.js components natively inside React [cite: 120]
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StockChartProps {
  symbol: string;
}

export function StockChart({ symbol }: StockChartProps) {
  // Store the nested historical points array explicitly
  const [points, setPoints] = useState<StockHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Await the StockHistory response object from your API
        const historyData = await stocksApi.getHistoricalData(symbol);
        
        // 2. Safely extract and assign the points array
        setPoints(historyData.points || []);
      } catch (err) {
        setError('Failed to load historical data trends.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [symbol]);

  if (loading) {
    return (
      <div className="h-72 flex items-center justify-center text-slate-500">
        Loading price history chart...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-72 flex items-center justify-center text-red-500 font-medium">
        {error}
      </div>
    );
  }

  // 3. Construct Chart.js datasets using the straight 'date' and 'close' mapping structures
  const chartData: ChartData<'line'> = {
    labels: points.map((p) => p.date),
    datasets: [
      {
        label: `${symbol} Closing Price`,
        data: points.map((p) => p.close), // Mapped straight to your 'close' property
        borderColor: '#3b82f6', // Tailwind CSS blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.04)', // Light area gradient under line [cite: 123]
        fill: true,
        tension: 0.12, // Smooth layout curves
        pointRadius: 0, // Clean minimalistic layout style [cite: 123]
        pointHoverRadius: 5,
        borderWidth: 2,
      },
    ],
  };

  // 4. Set up explicit responsive display parameters [cite: 122]
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false, // Fits dynamically within parent bounds [cite: 122]
    plugins: {
      legend: {
        display: false, // Hides redundant layout title boxes
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        padding: 10,
        backgroundColor: '#1e293b', // Slate-800 look
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
      },
    },
    scales: {
      x: {
        grid: {
          display: false, // Keeps baseline grids transparent
        },
        ticks: {
          color: '#94a3b8', // Slate-400 ticks
          maxTicksLimit: 7, // Prevents text overlaps across dense timelines
        },
      },
      y: {
        grid: {
          color: '#f1f5f9', // Clean slate-100 parallel lines
        },
        ticks: {
          color: '#94a3b8',
          callback: (value) => `$${Number(value).toFixed(2)}`, // Formatted currency decimals
        },
      },
    },
  };

  return (
    <div className="w-full h-72 mt-4">
      <Line data={chartData} options={options} />
    </div>
  );
}