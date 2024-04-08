import React, { useEffect, useState } from 'react';
import Chart from 'chart.js/auto';
import * as d3 from 'd3';




function Dashboard() {
    const [transactions, setTransactions] = useState([]);
    const [chartInstance, setChartInstance] = useState(null); // 用于存储 Chart.js 实例
    const [monthlyChartInstance, setMonthlyChartInstance] = useState(null);

    useEffect(() => {
        fetch('http://localhost:8000/transactions')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json(); // 解析 JSON 数据
            })
            .then(data => {
                setTransactions(data); // 将获取的数据设置到状态中
            })
            .catch(error => {
                console.error('There was a problem with your fetch operation:', error);
            });
    }, []); // 通过传递空数组作为依赖项，确保该 useEffect 仅在初始渲染时执行一次

    console.log(transactions);


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
                            'rgba(255, 99, 132, 0.5)',
                            'rgba(54, 162, 235, 0.5)',
                            'rgba(255, 206, 86, 0.5)',
                            'rgba(75, 192, 192, 0.5)',
                            'rgba(153, 102, 255, 0.5)',
                            'rgba(255, 159, 64, 0.5)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    layout: {
                        padding: 0 // 设置内边距为 0
                    }
                }
            });
            // Set canvas size before creating chart instance
            // ctx.width = 400;
            // ctx.height = 400;
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
                'rgba(255, 99, 132, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(75, 192, 192, 0.5)',
                'rgba(153, 102, 255, 0.5)',
                'rgba(255, 159, 64, 0.5)'
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
                            // beginAtZero: true ,// y 轴从 0 开始
                            stacked : true
                        },
                        x: {
                            stacked: true // x 轴堆叠
                        },
                        yAxes: [{
                            stacked: true // y 轴堆叠
                        }]
                    },
                    // borderWidth: 1

                }
            });
            setMonthlyChartInstance(newChartInstance);
        }
    }, [transactions]);

    return (
        <div>
            <h1>Dashboard</h1>
            <div className="chart_container">
                <div className="pie">
                    <span>Yearly Expense Breakdown</span>
                    <canvas id="myDoughnutChart" style={{ maxWidth: "350px" }}></canvas>
                </div>
                <div className="bar">
                    <span>Monthly Expense</span>
                    <canvas id="monthlyChart" style={{ maxWidth: "600px" }}></canvas>
                </div>

            </div>


        </div>
    );
}

export default Dashboard;