import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export const calculateDynamicPrice = (basePrice, flightDetails) => {
  const now = new Date();
  const departureDate = new Date(flightDetails.departureTime);
  const daysUntilDeparture = Math.ceil((departureDate - now) / (1000 * 60 * 60 * 24));

  // Demand-based pricing
  const occupancyRate = flightDetails.bookedSeats / flightDetails.totalSeats;
  const demandMultiplier = 1 + (occupancyRate * 0.5); // Up to 50% increase based on occupancy

  // Time-based pricing
  const timeMultiplier = 
    daysUntilDeparture < 3 ? 1.3 : // Last 3 days premium
    daysUntilDeparture < 7 ? 1.2 : // Last week premium
    daysUntilDeparture < 30 ? 1.1 : // Last month slight increase
    1;

  // Seasonal pricing
  const month = departureDate.getMonth();
  const seasonalMultiplier = 
    (month >= 5 && month <= 8) ? 1.15 : // Summer premium
    (month === 11 || month === 0) ? 1.2 : // Holiday season premium
    1;

  // Calculate final price
  const dynamicPrice = basePrice * demandMultiplier * timeMultiplier * seasonalMultiplier;
  
  return Math.round(dynamicPrice);
};

export const getActiveOffers = async (route) => {
  try {
    const now = new Date();
    const offersRef = collection(db, 'offers');
    const snapshot = await getDocs(offersRef);
    
    // Filter offers in memory instead of using Firebase queries
    const offers = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(offer => {
        const endTime = new Date(offer.endTime);
        return (
          offer.active === true &&
          endTime > now &&
          (!offer.routes?.length || offer.routes.includes(route))
        );
      });
    
    return offers;
  } catch (error) {
    console.error('Error fetching offers:', error);
    return [];
  }
};

export const applyOffers = (price, offers) => {
  if (!offers || !offers.length) return price;

  // Find the best discount
  const maxDiscount = Math.max(...offers.map(offer => offer.discountPercentage));
  const discountedPrice = price * (1 - maxDiscount / 100);

  return Math.round(discountedPrice);
}; 