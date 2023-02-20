import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);


const DoughnutChart = (props) => {

  const chartData = {
    labels: [
      props.marketInfo.selectionOneTitle,
      props.marketInfo.selectionTwoTitle
    ],
    datasets: [
      {
        label: 'Bet Distribution',
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
        borderWidth: 2,
      },
    ],
  };

  return (
    <div>
      <Doughnut 
        data={chartData}
        options={
          {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position:'bottom',
                    labels: {
                        color: 'white'
                    }
                }
            }
          }
        }
      />
    </div>
  );
}

export default DoughnutChart;