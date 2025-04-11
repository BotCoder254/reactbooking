import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar, Pie } from 'react-chartjs-2';
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
import { calculateDynamicPrice } from '../../utils/pricingUtils';

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

const PricingAnalytics = () => {
  const [pricingData, setPricingData] = useState({
    priceHistory: [],
    demandImpact: [],
    seasonalTrends: [],
    routePricing: []
  });

  useEffect(() => {
    fetchPricingData();
  }, []);

  const fetchPricingData = async () => {
    try {
      const flightsRef = collection(db, 'flights');
      const snapshot = await getDocs(flightsRef);
      const flights = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Process data for visualizations
      processPricingData(flights);
    } catch (error) {
      console.error('Error fetching pricing data:', error);
    }
  };

  const processPricingData = (flights) => {
    // Price History Data
    const priceHistory = flights.map(flight => ({
      date: new Date(flight.departureTime),
      basePrice: flight.price,
      dynamicPrice: calculateDynamicPrice(flight.price, {
        departureTime: flight.departureTime,
        bookedSeats: flight.bookedSeats || 0,
        totalSeats: flight.totalSeats || 100
      })
    })).sort((a, b) => a.date - b.date);

    // Demand Impact Data
    const demandImpact = flights.map(flight => ({
      route: `${flight.departureCity} - ${flight.arrivalCity}`,
      occupancyRate: (flight.bookedSeats || 0) / (flight.totalSeats || 100),
      priceIncrease: ((calculateDynamicPrice(flight.price, {
        departureTime: flight.departureTime,
        bookedSeats: flight.bookedSeats || 0,
        totalSeats: flight.totalSeats || 100
      }) - flight.price) / flight.price) * 100
    }));

    // Seasonal Trends
    const seasonalTrends = Array(12).fill(0).map((_, month) => {
      const monthFlights = flights.filter(f => new Date(f.departureTime).getMonth() === month);
      return {
        month: new Date(2024, month).toLocaleString('default', { month: 'short' }),
        avgPriceMultiplier: monthFlights.length > 0 
          ? monthFlights.reduce((acc, flight) => {
              const dynamicPrice = calculateDynamicPrice(flight.price, {
                departureTime: flight.departureTime,
                bookedSeats: flight.bookedSeats || 0,
                totalSeats: flight.totalSeats || 100
              });
              return acc + (dynamicPrice / flight.price);
            }, 0) / monthFlights.length
          : 1
      };
    });

    // Route Pricing Analysis
    const routePricing = Object.values(flights.reduce((acc, flight) => {
      const route = `${flight.departureCity} - ${flight.arrivalCity}`;
      if (!acc[route]) {
        acc[route] = {
          route,
          avgBasePrice: 0,
          avgDynamicPrice: 0,
          count: 0
        };
      }
      acc[route].avgBasePrice += flight.price;
      acc[route].avgDynamicPrice += calculateDynamicPrice(flight.price, {
        departureTime: flight.departureTime,
        bookedSeats: flight.bookedSeats || 0,
        totalSeats: flight.totalSeats || 100
      });
      acc[route].count++;
      return acc;
    }, {})).map(route => ({
      ...route,
      avgBasePrice: route.avgBasePrice / route.count,
      avgDynamicPrice: route.avgDynamicPrice / route.count
    }));

    setPricingData({
      priceHistory,
      demandImpact,
      seasonalTrends,
      routePricing
    });
  };

  const priceHistoryChart = {
    labels: pricingData.priceHistory.map(p => p.date.toLocaleDateString()),
    datasets: [
      {
        label: 'Base Price',
        data: pricingData.priceHistory.map(p => p.basePrice),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.4,
        fill: false
      },
      {
        label: 'Dynamic Price',
        data: pricingData.priceHistory.map(p => p.dynamicPrice),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.4,
        fill: false
      }
    ]
  };

  const demandImpactChart = {
    labels: pricingData.demandImpact.map(d => d.route),
    datasets: [
      {
        label: 'Occupancy Rate',
        data: pricingData.demandImpact.map(d => d.occupancyRate * 100),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Price Increase %',
        data: pricingData.demandImpact.map(d => d.priceIncrease),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      }
    ]
  };

  const seasonalTrendsChart = {
    labels: pricingData.seasonalTrends.map(s => s.month),
    datasets: [{
      label: 'Price Multiplier',
      data: pricingData.seasonalTrends.map(s => s.avgPriceMultiplier),
      backgroundColor: 'rgba(153, 102, 255, 0.5)',
      borderColor: 'rgb(153, 102, 255)',
      fill: true
    }]
  };

  const routePricingChart = {
    labels: pricingData.routePricing.map(r => r.route),
    datasets: [
      {
        label: 'Average Base Price',
        data: pricingData.routePricing.map(r => r.avgBasePrice),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Average Dynamic Price',
        data: pricingData.routePricing.map(r => r.avgDynamicPrice),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      }
    ]
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Price History Trend */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Price History Trend</h3>
          <div className="h-[300px]">
            <Line
              data={priceHistoryChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' },
                  tooltip: { mode: 'index' }
                }
              }}
            />
          </div>
        </div>

        {/* Demand Impact Analysis */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Demand Impact Analysis</h3>
          <div className="h-[300px]">
            <Bar
              data={demandImpactChart}
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

        {/* Seasonal Price Trends */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Seasonal Price Trends</h3>
          <div className="h-[300px]">
            <Line
              data={seasonalTrendsChart}
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

        {/* Route Pricing Comparison */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Route Pricing Comparison</h3>
          <div className="h-[300px]">
            <Bar
              data={routePricingChart}
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
      </motion.div>
    </div>
  );
};

export default PricingAnalytics; 