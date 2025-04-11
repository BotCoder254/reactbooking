import { motion } from 'framer-motion';
import { FaTag, FaClock } from 'react-icons/fa';
import { useState, useEffect } from 'react';

const DynamicPriceDisplay = ({ basePrice, flightDetails, offer }) => {
  const [finalPrice, setFinalPrice] = useState(basePrice);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    calculateDynamicPrice();
    if (offer?.endTime) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const end = new Date(offer.endTime).getTime();
        const distance = end - now;
        
        if (distance < 0) {
          setTimeLeft(null);
          clearInterval(interval);
        } else {
          const hours = Math.floor(distance / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${hours}h ${minutes}m`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [basePrice, flightDetails, offer]);

  const calculateDynamicPrice = () => {
    let price = basePrice;
    const now = new Date();
    const departureDate = new Date(flightDetails.departureTime);
    const daysUntilDeparture = Math.ceil((departureDate - now) / (1000 * 60 * 60 * 24));

    // Demand-based pricing (example factors)
    const demandMultiplier = 1 + (flightDetails.bookedSeats / flightDetails.totalSeats);
    
    // Time-based pricing
    const timeMultiplier = daysUntilDeparture < 7 ? 1.2 : // Last week premium
                          daysUntilDeparture < 30 ? 1.1 : // Last month slight increase
                          1;

    // Seasonal pricing (example: summer premium)
    const month = departureDate.getMonth();
    const seasonalMultiplier = (month >= 5 && month <= 8) ? 1.15 : 1;

    // Apply multipliers
    price = price * demandMultiplier * timeMultiplier * seasonalMultiplier;

    // Apply offer discount if available
    if (offer && new Date(offer.endTime) > now) {
      price = price * (1 - offer.discountPercentage / 100);
    }

    setFinalPrice(Math.round(price));
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <span className="text-2xl font-bold text-primary">
          ${finalPrice.toFixed(2)}
        </span>
        {basePrice > finalPrice && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-gray-500 line-through"
          >
            ${basePrice.toFixed(2)}
          </motion.span>
        )}
      </div>
      
      {offer && timeLeft && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center mt-1 text-sm text-green-600"
        >
          <FaTag className="mr-1" />
          <span className="font-medium">{offer.name}</span>
          <div className="flex items-center ml-2">
            <FaClock className="mr-1" />
            <span>{timeLeft} left</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DynamicPriceDisplay; 