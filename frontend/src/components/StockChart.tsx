import { useQuery } from '@tanstack/react-query';
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
  type ChartData,
} from 'chart.js';
import * as stocksApi from '../api/stocks';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface StockChartProps {
  symbol: string;
}

export function StockChart({ symbol }: StockChartProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['stockHistory', symbol],
    queryFn: () => stocksApi.getHistoricalData(symbol),
    enabled: !!symbol,
  });

  if (isLoading) {
    return (
      <div className="h-72 flex items-center justify-center text-slate-500">
        Loading price history chart...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-72 flex items-center justify-center text-red-500 font-medium">
        Failed to load historical data trends.
      </div>
    );
  }

  const points = data.points || [];

  const chartData: ChartData<'line'> = {
    labels: points.map((p) => p.date),
    datasets: [
      {
        label: `${symbol} Closing Price`,
        data: points.map((p) => p.close),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.04)',
        fill: true,
        tension: 0.12,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        padding: 10,
        backgroundColor: '#1e293b',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', maxTicksLimit: 7 },
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          color: '#94a3b8',
          callback: (value) => `$${Number(value).toFixed(2)}`,
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