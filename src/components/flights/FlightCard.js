import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlane, FaWifi, FaUtensils, FaTv, FaPlug, FaHeart, FaRegHeart, FaShare } from 'react-icons/fa';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const FlightCard = ({ flight, onSelect }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    checkIfSaved();
  }, [flight.id, user?.uid]);

  const checkIfSaved = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'saved_flights'),
        where('userId', '==', user.uid),
        where('flightId', '==', flight.id)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setIsSaved(true);
        setSavedId(querySnapshot.docs[0].id);
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleSaveToggle = async () => {
    if (!user) {
      alert('Please login to save flights');
      return;
    }

    try {
      if (isSaved) {
        await deleteDoc(doc(db, 'saved_flights', savedId));
        setIsSaved(false);
        setSavedId(null);
      } else {
        const savedRef = await addDoc(collection(db, 'saved_flights'), {
          userId: user.uid,
          flightId: flight.id,
          savedAt: new Date().toISOString(),
          ...flight
        });
        setIsSaved(true);
        setSavedId(savedRef.id);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/flights/${flight.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Flight ${flight.flightNumber}`,
          text: `Check out this flight from ${flight.departureCity} to ${flight.arrivalCity}`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShowShareTooltip(true);
        setTimeout(() => setShowShareTooltip(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDateTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 w-full"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
              <FaPlane className="text-primary text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {flight.airline} - {flight.flightNumber}
              </h3>
              <p className="text-gray-600">{flight.aircraft}</p>
            </div>
          </div>
          <div className="text-right flex items-center gap-4">
            <div className="relative">
              <button
                onClick={handleShare}
                className="text-gray-500 hover:text-primary transition-colors"
                aria-label="Share flight"
              >
                <FaShare />
              </button>
              {showShareTooltip && (
                <div className="absolute right-0 -bottom-8 bg-gray-800 text-white text-xs py-1 px-2 rounded">
                  Link copied!
                </div>
              )}
            </div>
            <button
              onClick={handleSaveToggle}
              className={`transition-colors ${isSaved ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-red-500'}`}
              aria-label={isSaved ? 'Remove from saved' : 'Save flight'}
            >
              {isSaved ? <FaHeart /> : <FaRegHeart />}
            </button>
            <div>
              <p className="text-xl font-bold text-primary">${flight.price}</p>
              <p className="text-sm text-gray-500">per person</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500">Departure</p>
            <p className="font-semibold">{flight.departureCity}</p>
            <p className="text-sm text-gray-600">{formatDateTime(flight.departureTime)}</p>
          </div>
          <div className="flex flex-col items-center px-4">
            <p className="text-sm text-gray-500 mb-1">{formatDuration(flight.duration)}</p>
            <div className="relative w-32">
              <div className="absolute w-full h-0.5 bg-gray-300 top-1/2 transform -translate-y-1/2"></div>
              <FaPlane className="relative text-primary transform rotate-90" />
            </div>
            <p className="text-sm text-gray-500 mt-1">{flight.stops} stop(s)</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Arrival</p>
            <p className="font-semibold">{flight.arrivalCity}</p>
            <p className="text-sm text-gray-600">{formatDateTime(flight.arrivalTime)}</p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-4">
              {flight.amenities?.wifi && (
                <div className="flex items-center text-gray-600">
                  <FaWifi className="mr-1" />
                  <span className="text-sm">WiFi</span>
                </div>
              )}
              {flight.amenities?.meals && (
                <div className="flex items-center text-gray-600">
                  <FaUtensils className="mr-1" />
                  <span className="text-sm">Meals</span>
                </div>
              )}
              {flight.amenities?.entertainment && (
                <div className="flex items-center text-gray-600">
                  <FaTv className="mr-1" />
                  <span className="text-sm">Entertainment</span>
                </div>
              )}
              {flight.amenities?.powerOutlets && (
                <div className="flex items-center text-gray-600">
                  <FaPlug className="mr-1" />
                  <span className="text-sm">Power</span>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {flight.amenities?.baggage && `Baggage: ${flight.amenities.baggage}`}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">Available Seats:</span>
              <span className="ml-2">
                Economy: {flight.totalSeats?.economy || 0},
                Business: {flight.totalSeats?.business || 0},
                First: {flight.totalSeats?.first || 0}
              </span>
            </div>
            <button
              onClick={() => onSelect(flight)}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition-colors"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FlightCard; 