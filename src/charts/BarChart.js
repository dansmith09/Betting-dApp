import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );

const BarChart = (props) => {

  const chartData = {
    labels: [
      props.marketInfo.selectionOneTitle,
      props.marketInfo.selectionTwoTitle
    ],
    datasets: [
      {
        label: 'Bet Amount',
        data: [
          parseFloat(props.marketInfo.outcomeOneBetAmount),
          parseFloat(props.marketInfo.outcomeTwoBetAmount)
        ],
        backgroundColor: [
          'rgb(16, 135, 243, 0.3)',
          'rgb(172, 67, 224, 0.3)',
        ],
        borderColor: [
          'rgb(16, 135, 243, 1)',
          'rgb(172, 67, 224, 1)',
        ],
      },
    ],
  };

  const options = {
    aspectRatio: 1,
    scales: {
      y: {
        ticks: { color: 'white' }
      },
      x: {
        ticks: { color: 'white' }
      }
    },
    elements: {
      bar: {
        borderWidth: 2,
      },
    },
    responsive: true,
    plugins: {
      legend: {
        labels: {
          fontColor: 'white'
        },
        display: false
      },
      title: {
        display: false,
      },
    },
  };

  return (
    <div>
      <Bar data={chartData} options={options}/>
    </div>
  );
}

export default BarChart;