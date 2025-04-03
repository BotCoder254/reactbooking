import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { FaPlane, FaUser, FaCalendar, FaClock, FaDownload, FaPrint, FaArrowLeft } from 'react-icons/fa';
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/my-bookings')}
              className="flex items-center text-gray-600 hover:text-primary transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              Back to My Bookings
            </button>
          </div>

          <div id="ticket" className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Your Flight Ticket</h2>
                <div className="text-sm text-gray-500">Booking #{booking?.id?.slice(0, 8)}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center mb-4">
                    <FaPlane className="text-primary mr-2" />
                    <div>
                      <div className="text-sm text-gray-500">Flight</div>
                      <div className="font-semibold">
                        {booking?.flightDetails?.airline || 'N/A'} - {booking?.flightDetails?.flightNumber || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center mb-4">
                    <FaCalendar className="text-primary mr-2" />
                    <div>
                      <div className="text-sm text-gray-500">Date</div>
                      <div className="font-semibold">
                        {booking?.flightDetails?.departureTime
                          ? new Date(booking.flightDetails.departureTime).toLocaleDateString()
                          : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center mb-4">
                    <FaClock className="text-primary mr-2" />
                    <div>
                      <div className="text-sm text-gray-500">Time</div>
                      <div className="font-semibold">
                        {booking?.flightDetails?.departureTime
                          ? new Date(booking.flightDetails.departureTime).toLocaleTimeString()
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center mb-4">
                    <FaUser className="text-primary mr-2" />
                    <div>
                      <div className="text-sm text-gray-500">Passenger(s)</div>
                      <div className="font-semibold">{booking?.passengers?.length || 0}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-gray-500">Route</div>
                    <div className="font-semibold">
                      {booking?.flightDetails?.departureCity || 'N/A'} →{' '}
                      {booking?.flightDetails?.arrivalCity || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Class</div>
                    <div className="font-semibold">{booking?.selectedClass || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Passenger Information</h3>
              <div className="space-y-4">
                {booking?.passengers?.map((passenger, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">
                        {passenger.firstName} {passenger.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {passenger.type} - Seat {passenger.seatNumber || 'Not assigned'}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {passenger.specialRequests && `Special Requests: ${passenger.specialRequests}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-b border-gray-200 pb-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Booking Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    booking?.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {(booking?.status || 'Pending').charAt(0).toUpperCase() + (booking?.status || 'Pending').slice(1)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Amount</div>
                  <div className="text-2xl font-bold text-primary">
                    ${booking?.totalPrice?.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-500">Booking Date</div>
                <div className="font-semibold">
                  {booking?.createdAt ? new Date(booking.createdAt).toLocaleString() : 'N/A'}
                </div>
              </div>
              {booking?.status === 'confirmed' && (
                <div className="text-sm text-green-600 font-semibold">
                  ✓ Payment Confirmed
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center space-x-4">
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
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default BookingDetails; 