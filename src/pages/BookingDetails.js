import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import DashboardLayout from '../components/layouts/DashboardLayout';
import VirtualBoardingPass from '../components/boarding/VirtualBoardingPass';
import { FaPlane, FaUser, FaCalendar, FaClock, FaDownload, FaPrint, FaArrowLeft, FaTicketAlt } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      const bookingDoc = await getDoc(doc(db, 'bookings', id));
      if (bookingDoc.exists()) {
        setBooking({
          id: bookingDoc.id,
          ...bookingDoc.data()
        });
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    const ticket = document.getElementById('ticket');
    const canvas = await html2canvas(ticket);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`flight-ticket-${booking.id}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatSeatInfo = (passenger) => {
    if (!passenger.seatNumber) return 'Not assigned';
    const seatClass = {
      'E': 'Economy',
      'B': 'Business',
      'F': 'First'
    }[passenger.seatNumber.charAt(0)];
    return `${seatClass} - ${passenger.seatNumber}`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-800">Booking not found</h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Booking Details</h1>
          <p className="text-gray-600">Booking Reference: #{booking.id.substring(0, 8)}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Booking Information */}
          <div className="space-y-6">
            {/* Flight Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center mb-4">
                <FaPlane className="text-primary mr-2" />
                <h2 className="text-lg font-semibold">Flight Details</h2>
          </div>
              <div className="space-y-3">
                <p className="flex justify-between">
                  <span className="text-gray-600">Flight Number</span>
                  <span className="font-medium">{booking.flightDetails?.flightNumber}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-600">From</span>
                  <span className="font-medium">{booking.flightDetails?.departureCity}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-600">To</span>
                  <span className="font-medium">{booking.flightDetails?.arrivalCity}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-600">Date</span>
                  <span className="font-medium">
                    {new Date(booking.flightDetails?.departureTime).toLocaleDateString()}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-600">Time</span>
                  <span className="font-medium">
                    {new Date(booking.flightDetails?.departureTime).toLocaleTimeString()}
                  </span>
                </p>
              </div>
            </motion.div>

            {/* Passenger Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
                  <div className="flex items-center mb-4">
                    <FaUser className="text-primary mr-2" />
                <h2 className="text-lg font-semibold">Passenger Information</h2>
              </div>
              <div className="space-y-4">
                {booking.passengers?.map((passenger, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">
                      {passenger.title} {passenger.firstName} {passenger.lastName}
                    </p>
                    <p className="text-sm text-gray-600">Seat: {passenger.seatNumber || 'Not Assigned'}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Payment Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center mb-4">
                <FaTicketAlt className="text-primary mr-2" />
                <h2 className="text-lg font-semibold">Payment Information</h2>
            </div>
              <div className="space-y-3">
                <p className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-medium ${
                    booking.status === 'confirmed' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-medium">${booking.totalPrice?.toFixed(2)}</span>
                </p>
              </div>
            </motion.div>
            </div>

          {/* Virtual Boarding Pass */}
          {booking.status === 'confirmed' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <VirtualBoardingPass bookingId={booking.id} />
            </motion.div>
          )}
          </div>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => navigate('/my-bookings')}
            className="flex items-center text-gray-600 hover:text-primary transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to My Bookings
          </button>
          <div className="flex space-x-4">
            <button
              onClick={downloadPDF}
              className="flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              <FaDownload className="mr-2" />
              Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FaPrint className="mr-2" />
              Print Ticket
            </button>
          </div>
          </div>
        </motion.div>
    </DashboardLayout>
  );
};

export default BookingDetails; 