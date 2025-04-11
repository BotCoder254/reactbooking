import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { FaPlane, FaSuitcase, FaUtensils, FaHotel, FaEdit, FaSave } from 'react-icons/fa';

const TripBudgetPlanner = () => {
  const { user } = useAuth();
  const [budget, setBudget] = useState({
    total: 0,
    flights: 0,
    accommodation: 0,
    activities: 0,
    extras: 0
  });
  const [expenses, setExpenses] = useState({
    flights: 0,
    accommodation: 0,
    activities: 0,
    extras: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (user) {
      fetchBudget();
      fetchExpenses();
    }
  }, [user]);

  const fetchBudget = async () => {
    try {
      const budgetRef = collection(db, 'user_budgets');
      const q = query(budgetRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const budgetData = snapshot.docs[0].data();
        setBudget(budgetData.budget);
      }
    } catch (error) {
      console.error('Error fetching budget:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const expensesRef = collection(db, 'user_expenses');
      const q = query(expensesRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const expensesData = snapshot.docs[0].data();
        setExpenses(expensesData.expenses);
        checkBudgetAndSuggest(expensesData.expenses);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const checkBudgetAndSuggest = async (currentExpenses) => {
    try {
      // Check if any category exceeds budget
      const exceededCategories = Object.keys(currentExpenses).filter(
        category => currentExpenses[category] > budget[category]
      );

      if (exceededCategories.length > 0) {
        // Fetch alternative options
        const flightsRef = collection(db, 'flights');
        const snapshot = await getDocs(flightsRef);
        const flights = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Find cheaper alternatives
        const newSuggestions = flights
          .filter(flight => flight.price < currentExpenses.flights)
          .sort((a, b) => a.price - b.price)
          .slice(0, 3);

        setSuggestions(newSuggestions);
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
  };

  const saveBudget = async () => {
    try {
      const budgetRef = collection(db, 'user_budgets');
      const q = query(budgetRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await addDoc(budgetRef, {
          userId: user.uid,
          budget,
          createdAt: new Date()
        });
      } else {
        const budgetDoc = snapshot.docs[0];
        await updateDoc(doc(db, 'user_budgets', budgetDoc.id), {
          budget,
          updatedAt: new Date()
        });
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const calculateProgress = (category) => {
    const spent = expenses[category] || 0;
    const allocated = budget[category] || 1;
    return (spent / allocated) * 100;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Trip Budget Planner</h2>
          <button
            onClick={() => isEditing ? saveBudget() : setIsEditing(true)}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            {isEditing ? (
              <>
                <FaSave className="mr-2" />
                Save Budget
              </>
            ) : (
              <>
                <FaEdit className="mr-2" />
                Edit Budget
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Flights Budget */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <FaPlane className="text-primary mr-2" />
                <span className="font-medium">Flights</span>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  value={budget.flights}
                  onChange={(e) => setBudget({ ...budget, flights: parseFloat(e.target.value) })}
                  className="w-24 px-2 py-1 border border-gray-300 rounded"
                />
              ) : (
                <span>${budget.flights}</span>
              )}
            </div>
            <div className="relative pt-1">
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(calculateProgress('flights'), 100)}%` }}
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                    calculateProgress('flights') > 100 ? 'bg-red-500' : 'bg-primary'
                  }`}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Spent: ${expenses.flights} / ${budget.flights}
              </div>
            </div>
          </div>

          {/* Accommodation Budget */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <FaHotel className="text-primary mr-2" />
                <span className="font-medium">Accommodation</span>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  value={budget.accommodation}
                  onChange={(e) => setBudget({ ...budget, accommodation: parseFloat(e.target.value) })}
                  className="w-24 px-2 py-1 border border-gray-300 rounded"
                />
              ) : (
                <span>${budget.accommodation}</span>
              )}
            </div>
            <div className="relative pt-1">
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(calculateProgress('accommodation'), 100)}%` }}
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                    calculateProgress('accommodation') > 100 ? 'bg-red-500' : 'bg-primary'
                  }`}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Spent: ${expenses.accommodation} / ${budget.accommodation}
              </div>
            </div>
          </div>

          {/* Activities Budget */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <FaSuitcase className="text-primary mr-2" />
                <span className="font-medium">Activities</span>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  value={budget.activities}
                  onChange={(e) => setBudget({ ...budget, activities: parseFloat(e.target.value) })}
                  className="w-24 px-2 py-1 border border-gray-300 rounded"
                />
              ) : (
                <span>${budget.activities}</span>
              )}
            </div>
            <div className="relative pt-1">
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(calculateProgress('activities'), 100)}%` }}
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                    calculateProgress('activities') > 100 ? 'bg-red-500' : 'bg-primary'
                  }`}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Spent: ${expenses.activities} / ${budget.activities}
              </div>
            </div>
          </div>

          {/* Extras Budget */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <FaUtensils className="text-primary mr-2" />
                <span className="font-medium">Extras</span>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  value={budget.extras}
                  onChange={(e) => setBudget({ ...budget, extras: parseFloat(e.target.value) })}
                  className="w-24 px-2 py-1 border border-gray-300 rounded"
                />
              ) : (
                <span>${budget.extras}</span>
              )}
            </div>
            <div className="relative pt-1">
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(calculateProgress('extras'), 100)}%` }}
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                    calculateProgress('extras') > 100 ? 'bg-red-500' : 'bg-primary'
                  }`}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Spent: ${expenses.extras} / ${budget.extras}
              </div>
            </div>
          </div>
        </div>

        {/* Budget Suggestions */}
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 p-4 bg-blue-50 rounded-lg"
          >
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Budget-Friendly Suggestions</h3>
            <div className="space-y-2">
              {suggestions.map((flight) => (
                <div key={flight.id} className="flex items-center justify-between bg-white p-3 rounded">
                  <div>
                    <p className="font-medium">{flight.airline} - {flight.flightNumber}</p>
                    <p className="text-sm text-gray-600">
                      {flight.departureCity} → {flight.arrivalCity}
                    </p>
                  </div>
                  <div className="text-primary font-bold">${flight.price}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default TripBudgetPlanner; 