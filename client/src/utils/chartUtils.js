// Utility functions for chart data processing and configuration
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Chart color palettes - keeping existing custom colors
export const colorPalettes = {
  primary: [
    '#6e63e5', // Custom purple
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#06B6D4', // cyan-500
    '#84CC16', // lime-500
    '#F97316', // orange-500
  ],
  pastel: [
    '#D3CEFC', // Custom purple pastel
    '#6EE7B7', // emerald-300
    '#FDE68A', // amber-300
    '#FCA5A5', // red-300
    '#C4B5FD', // violet-300
    '#67E8F9', // cyan-300
    '#BEF264', // lime-300
    '#FDBA74', // orange-300
  ],
  grayscale: [
    '#374151', // gray-700
    '#6B7280', // gray-500
    '#9CA3AF', // gray-400
    '#D1D5DB', // gray-300
    '#E5E7EB', // gray-200
    '#F3F4F6', // gray-100
  ]
};

// Generate chart data for line charts
export const generateLineChartData = (data, xField, yField, label) => {
  return {
    labels: data.map(item => item[xField]),
    datasets: [{
      label: label || yField,
      data: data.map(item => item[yField]),
      borderColor: colorPalettes.primary[0],
      backgroundColor: colorPalettes.primary[0] + '20',
      tension: 0.4,
      fill: false,
      pointBackgroundColor: colorPalettes.primary[0],
      pointBorderColor: colorPalettes.primary[0],
      pointRadius: 4,
      pointHoverRadius: 6,
    }]
  };
};

// Generate chart data for bar charts with alternating colors
export const generateBarChartData = (data, xField, yField, label) => {
  return {
    labels: data.map(item => item[xField]),
    datasets: [{
      label: label || yField,
      data: data.map(item => item[yField]),
      backgroundColor: data.map((_, index) => 
        index % 2 === 0 ? colorPalettes.pastel[0] : colorPalettes.primary[0]
      ),
      borderColor: data.map((_, index) => 
        index % 2 === 0 ? colorPalettes.pastel[0] : colorPalettes.primary[0]
      ),
      borderWidth: 0,
      borderRadius: 12, // rounded-xl equivalent
      borderSkipped: false,
    }]
  };
};

// Generate chart data for pie charts
export const generatePieChartData = (data, labelField, valueField) => {
  return {
    labels: data.map(item => item[labelField]),
    datasets: [{
      data: data.map(item => item[valueField]),
      backgroundColor: colorPalettes.primary.slice(0, data.length),
      borderColor: '#ffffff',
      borderWidth: 2,
    }]
  };
};

// Generate multi-series chart data
export const generateMultiSeriesData = (data, xField, series) => {
  return {
    labels: data.map(item => item[xField]),
    datasets: series.map((serie, index) => ({
      label: serie.label,
      data: data.map(item => item[serie.field]),
      backgroundColor: colorPalettes.primary[index % colorPalettes.primary.length] + '40',
      borderColor: colorPalettes.primary[index % colorPalettes.primary.length],
      borderWidth: 2,
      fill: serie.fill || false,
      tension: serie.tension || 0.4,
    }))
  };
};

// Common chart options
export const getChartOptions = (type = 'line', title = '') => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend by default to match existing design
        position: 'top',
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#6e63e5',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      }
    }
  };

  if (type === 'line') {
    return {
      ...baseOptions,
      scales: {
        x: {
          display: true,
          grid: {
            display: false,
          },
          ticks: {
            color: '#6B7280',
            font: {
              size: 12
            }
          }
        },
        y: {
          display: true,
          grid: {
            color: '#F3F4F6',
          },
          ticks: {
            color: '#6B7280',
            font: {
              size: 12
            }
          },
          beginAtZero: true
        }
      }
    };
  }

  if (type === 'bar') {
    return {
      ...baseOptions,
      scales: {
        x: {
          display: true,
          grid: {
            display: false,
          },
          ticks: {
            color: '#6B7280',
            font: {
              size: 12
            }
          }
        },
        y: {
          display: true,
          grid: {
            color: '#F3F4F6',
          },
          ticks: {
            color: '#6B7280',
            font: {
              size: 12
            }
          },
          beginAtZero: true
        }
      }
    };
  }

  if (type === 'pie') {
    return {
      ...baseOptions,
      plugins: {
        ...baseOptions.plugins,
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: '#6B7280',
            font: {
              size: 12
            },
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        }
      }
    };
  }

  return baseOptions;
};

// Calculate statistics
export const calculateStats = (data, field) => {
  const values = data.map(item => item[field]).filter(val => val !== null && val !== undefined);
  
  if (values.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      median: 0,
      sum: 0,
      count: 0
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const avg = sum / values.length;
  
  const median = values.length % 2 === 0
    ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
    : sorted[Math.floor(values.length / 2)];

  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: Number(avg.toFixed(2)),
    median: Number(median.toFixed(2)),
    sum: Number(sum.toFixed(2)),
    count: values.length
  };
};

// Generate trend data
export const generateTrendData = (data, field, period = 'day') => {
  const grouped = {};
  
  data.forEach(item => {
    let key;
    const date = new Date(item.date || item.createdAt);
    
    switch (period) {
      case 'hour':
        key = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
        break;
      case 'day':
        key = date.toISOString().slice(0, 10); // YYYY-MM-DD
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().slice(0, 10);
        break;
      case 'month':
        key = date.toISOString().slice(0, 7); // YYYY-MM
        break;
      default:
        key = date.toISOString().slice(0, 10);
    }
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item[field]);
  });

  return Object.entries(grouped).map(([date, values]) => ({
    date,
    value: values.reduce((sum, val) => sum + val, 0) / values.length,
    count: values.length
  })).sort((a, b) => new Date(a.date) - new Date(b.date));
};

// Format chart tooltip
export const formatTooltip = (context, labelFormatter = null) => {
  const { label, parsed } = context;
  const formattedLabel = labelFormatter ? labelFormatter(label) : label;
  return `${formattedLabel}: ${parsed.y || parsed}`;
};
