import React, { useEffect, useState } from 'react';
import Chart from 'chart.js/auto';

// Component for displaying dashboard with expense breakdown
function Dashboard() {
    // State variables for transactions, Chart.js instances, and current year
    const [transactions, setTransactions] = useState([]);
    const [chartInstance, setChartInstance] = useState(null);
    const [monthlyChartInstance, setMonthlyChartInstance] = useState(null);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    // Fetch transactions based on the current year
    useEffect(() => {
        fetch(`http://localhost:8000/transactions?year=${currentYear}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                setTransactions(data);
            })
            .catch(error => {
                console.error('There was a problem with your fetch operation:', error);
            });
    }, [currentYear]);
    console.log(transactions);

    // Handle previous year button click
    const handlePrevYear = () => {
        setCurrentYear(prevYear => prevYear - 1);
    };
    // Handle next year button click
    const handleNextYear = () => {
        setCurrentYear(prevYear => prevYear + 1);
    };

    // Update Chart.js instance when transactions change
    useEffect(() => {
        if (chartInstance) {
            chartInstance.destroy();
        }

        if (transactions.length > 0) {
            const categories = {};
            transactions.forEach(transaction => {
                if (categories[transaction.Category]) {
                    categories[transaction.Category] += transaction.Amount;
                } else {
                    categories[transaction.Category] = transaction.Amount;
                }
            });

            const ctx = document.getElementById('myDoughnutChart');

            const newChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(categories),
                    datasets: [{
                        label: 'Transaction Amount',
                        data: Object.values(categories),
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 206, 86, 0.6)',
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(153, 102, 255, 0.6)',
                            'rgba(255, 159, 64, 0.6)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    layout: {
                        padding: 0
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: 'rgba(255, 255, 255, 0.8)',
                            }
                        }
                    }
                }
            });
            setChartInstance(newChartInstance);
        }
    }, [transactions]);

    // Update monthly Chart.js instance when transactions change
    useEffect(() => {
        if (monthlyChartInstance) {
            monthlyChartInstance.destroy();
        }

        if (chartInstance) {
            chartInstance.destroy();
        }

        if (transactions.length > 0) {
            const monthlyData = Array.from({ length: 12 }, () => ({}));

            transactions.forEach(transaction => {
                const month = new Date(transaction.TransactionDate).getMonth();
                const categoryName = transaction.Category;
                if (!monthlyData[month][categoryName]) {
                    monthlyData[month][categoryName] = 0;
                }
                monthlyData[month][categoryName] += parseFloat(transaction.Amount);
            });

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const backgroundColors = [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)'
            ]
            const datasets = Object.keys(transactions.reduce((acc, cur) => {
                acc[cur.Category] = true;
                return acc;
            }, {})).map((category, index) => ({
                label: category,
                data: monthlyData.map(month => month[category] || 0),
                backgroundColor:backgroundColors[index % backgroundColors.length],
                borderWidth: 1
            }));

            const ctx = document.getElementById('monthlyChart');

            const newChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: monthNames,
                    datasets: datasets,

                },
                options: {
                    scales: {
                        y: {
                            stacked : true,
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.8)'
                            }
                        },
                        x: {
                            stacked: true,
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.8)'
                            }
                        },
                        yAxes: [{
                            stacked: true
                        }]
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: 'rgba(255, 255, 255, 0.8)',
                            }
                        }
                    }
                }
            });
            setMonthlyChartInstance(newChartInstance);
        }
    }, [transactions]);

    // JSX for rendering the component
    return (
        <div>
            <h1>Expense Dashboard</h1>

            <div className="year_widget">
                <span>Year Selection :</span>
                <button onClick={handlePrevYear} className="btn btn-outline-secondary">{'<'}</button>
                <span>{currentYear}</span>
                <button onClick={handleNextYear} className="btn btn-outline-secondary">{'>'}</button>
            </div>

            <div className="chart_container">
                <div className="pie">
                    <canvas id="myDoughnutChart"></canvas>
                    {transactions.length > 0 && <h5>Yearly Expense Breakdown</h5>}
                </div>

                <div className="bar">
                    <canvas id="monthlyChart"></canvas>
                    {transactions.length > 0 && <h5>Monthly Expense Breakdown</h5>}

                </div>
            </div>
        </div>
    );
}

export default Dashboard;