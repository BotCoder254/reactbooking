import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const BudgetAnalytics = () => {
  const [budgetData, setBudgetData] = useState({
    routeSpending: [],
    categoryDistribution: {},
    monthlyTrends: [],
    userSegments: []
  });

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    try {
      const [budgets, expenses] = await Promise.all([
        getDocs(collection(db, 'user_budgets')),
        getDocs(collection(db, 'user_expenses'))
      ]);

      const budgetsData = budgets.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const expensesData = expenses.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      processAnalyticsData(budgetsData, expensesData);
    } catch (error) {
      console.error('Error fetching budget analytics data:', error);
    }
  };

  const processAnalyticsData = (budgets, expenses) => {
    // Process route spending
    const routeSpending = expenses.reduce((acc, expense) => {
      const route = expense.route || 'Unknown';
      if (!acc[route]) {
        acc[route] = {
          total: 0,
          count: 0
        };
      }
      acc[route].total += expense.expenses.flights || 0;
      acc[route].count++;
      return acc;
    }, {});

    // Process category distribution
    const categoryDistribution = expenses.reduce((acc, expense) => {
      Object.entries(expense.expenses || {}).forEach(([category, amount]) => {
        acc[category] = (acc[category] || 0) + amount;
      });
      return acc;
    }, {});

    // Process monthly trends
    const monthlyTrends = Array(12).fill(0).map((_, month) => {
      const monthExpenses = expenses.filter(e => 
        new Date(e.createdAt?.toDate()).getMonth() === month
      );
      return {
        month: new Date(2024, month).toLocaleString('default', { month: 'short' }),
        total: monthExpenses.reduce((sum, e) => 
          sum + Object.values(e.expenses || {}).reduce((a, b) => a + b, 0), 0
        )
      };
    });

    setBudgetData({
      routeSpending: Object.entries(routeSpending).map(([route, data]) => ({
        route,
        averageSpending: data.total / data.count
      })),
      categoryDistribution,
      monthlyTrends,
      userSegments: calculateUserSegments(budgets)
    });
  };

  const calculateUserSegments = (budgets) => {
    const segments = {
      low: 0,
      medium: 0,
      high: 0
    };

    budgets.forEach(budget => {
      const total = budget.budget.total || 0;
      if (total < 1000) segments.low++;
      else if (total < 5000) segments.medium++;
      else segments.high++;
    });

    return segments;
  };

  const routeSpendingChart = {
    labels: budgetData.routeSpending.map(r => r.route),
    datasets: [{
      label: 'Average Spending per Route',
      data: budgetData.routeSpending.map(r => r.averageSpending),
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      borderColor: 'rgb(75, 192, 192)',
    }]
  };

  const categoryDistributionChart = {
    labels: Object.keys(budgetData.categoryDistribution),
    datasets: [{
      data: Object.values(budgetData.categoryDistribution),
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)'
      ],
      borderColor: [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 206, 86)',
        'rgb(75, 192, 192)'
      ]
    }]
  };

  const monthlyTrendsChart = {
    labels: budgetData.monthlyTrends.map(m => m.month),
    datasets: [{
      label: 'Monthly Spending Trends',
      data: budgetData.monthlyTrends.map(m => m.total),
      borderColor: 'rgb(153, 102, 255)',
      backgroundColor: 'rgba(153, 102, 255, 0.5)',
      fill: true
    }]
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Route Spending Analysis */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Route Spending Analysis</h3>
          <div className="h-[300px]">
            <Bar
              data={routeSpendingChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Expense Category Distribution</h3>
          <div className="h-[300px]">
            <Doughnut
              data={categoryDistributionChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'right' }
                }
              }}
            />
          </div>
        </div>

        {/* Monthly Spending Trends */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Spending Trends</h3>
          <div className="h-[300px]">
            <Line
              data={monthlyTrendsChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>
        </div>

        {/* User Budget Segments */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">User Budget Segments</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {budgetData.userSegments.low}
              </div>
              <div className="text-sm text-gray-600">Low Budget</div>
              <div className="text-xs text-gray-500">&lt; $1,000</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {budgetData.userSegments.medium}
              </div>
              <div className="text-sm text-gray-600">Medium Budget</div>
              <div className="text-xs text-gray-500">$1,000 - $5,000</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {budgetData.userSegments.high}
              </div>
              <div className="text-sm text-gray-600">High Budget</div>
              <div className="text-xs text-gray-500">&gt; $5,000</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BudgetAnalytics; 