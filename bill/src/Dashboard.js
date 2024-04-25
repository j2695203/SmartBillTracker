import React, { useEffect, useState } from 'react';
import Chart from 'chart.js/auto';

function Dashboard() {
    const [transactions, setTransactions] = useState([]);
    const [chartInstance, setChartInstance] = useState(null); // 用于存储 Chart.js 实例
    const [monthlyChartInstance, setMonthlyChartInstance] = useState(null);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear()); // 添加当前年份状态

    useEffect(() => {
        fetch(`http://localhost:8000/transactions?year=${currentYear}`) // 根据当前年份获取数据
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
    const handlePrevYear = () => {
        setCurrentYear(prevYear => prevYear - 1); // 更新当前年份为上一年
    };

    const handleNextYear = () => {
        setCurrentYear(prevYear => prevYear + 1); // 更新当前年份为下一年
    };


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
                        padding: 0 // 设置内边距为 0
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: 'rgba(255, 255, 255, 0.8)', // 设置图例标签的颜色，可以调整透明度
                            }
                        }
                    }
                }
            });
            setChartInstance(newChartInstance);
        }
    }, [transactions]);

    useEffect(() => {
        if (monthlyChartInstance) {
            monthlyChartInstance.destroy();
        }

        if (chartInstance) {
            chartInstance.destroy();
        }

        if (transactions.length > 0) {
            const monthlyData = Array.from({ length: 12 }, () => ({})); // 初始化月份数据对象

            transactions.forEach(transaction => {
                const month = new Date(transaction.TransactionDate).getMonth(); // 获取交易月份（0-11）
                const categoryName = transaction.Category;
                if (!monthlyData[month][categoryName]) {
                    monthlyData[month][categoryName] = 0;
                }
                monthlyData[month][categoryName] += parseFloat(transaction.Amount); // 将金额添加到对应类别的月份
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
                    labels: monthNames, // 使用英文缩写月份
                    datasets: datasets,

                },
                options: {
                    scales: {
                        y: {
                            stacked : true,
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.8)' // 设置 y 轴上数字的颜色
                            }
                        },
                        x: {
                            stacked: true, // x 轴堆叠
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.8)'
                            }
                        },
                        yAxes: [{
                            stacked: true // y 轴堆叠
                        }]
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: 'rgba(255, 255, 255, 0.8)', // 设置图例标签的颜色
                            }
                        }
                    }
                }
            });
            setMonthlyChartInstance(newChartInstance);
        }
    }, [transactions]);

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