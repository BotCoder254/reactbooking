import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaDownload, FaPlane, FaUser, FaCalendar, FaClock } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ETicketModal = ({ isOpen, onClose, booking }) => {
  useEffect(() => {
    // Load required scripts
    const loadScripts = async () => {
      if (typeof window.html2canvas === 'undefined') {
        await import('html2canvas');
      }
      if (typeof window.jsPDF === 'undefined') {
        await import('jspdf');
      }
    };
    loadScripts();
  }, []);

  const downloadETicket = async () => {
    const ticketElement = document.getElementById('e-ticket');
    if (ticketElement) {
      try {
        // Create a canvas from the ticket element
        const canvas = await html2canvas(ticketElement, {
          scale: 2,
          useCORS: true,
          logging: false,
        });

        // Create PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        // Add canvas to PDF
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        // Save the PDF
        pdf.save(`e-ticket-${booking?.id || 'flight'}.pdf`);
      } catch (error) {
        console.error('Error generating PDF:', error);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full"
          >
            <div className="p-6" id="e-ticket">
              {/* Header with Logo */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">E-Ticket</h2>
                  <p className="text-sm text-gray-500">Booking Reference: #{booking?.id?.substring(0, 8)}</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes size={24} />
                </button>
              </div>

              {/* Ticket Content */}
              <div className="border-t border-b border-gray-200 py-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Flight Details */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <FaPlane className="mr-2 text-primary" />
                      Flight Details
                    </h3>
                    <div className="space-y-3">
                      <p className="text-gray-600">
                        <span className="font-medium">From:</span>{' '}
                        {booking?.flightDetails?.departureCity}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">To:</span>{' '}
                        {booking?.flightDetails?.arrivalCity}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Flight Number:</span>{' '}
                        {booking?.flightDetails?.flightNumber || 'N/A'}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Class:</span>{' '}
                        {booking?.flightDetails?.class || 'Economy'}
                      </p>
                    </div>
                  </div>

                  {/* Passenger Details */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <FaUser className="mr-2 text-primary" />
                      Passenger Details
                    </h3>
                    <div className="space-y-3">
                      {booking?.passengers?.map((passenger, index) => (
                        <p key={index} className="text-gray-600">
                          {passenger.title} {passenger.firstName} {passenger.lastName}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Time and Date */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <FaCalendar className="mr-2 text-primary" />
                      Date
                    </h3>
                    <p className="text-gray-600">
                      {booking?.flightDetails?.departureTime
                        ? new Date(booking.flightDetails.departureTime).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <FaClock className="mr-2 text-primary" />
                      Time
                    </h3>
                    <p className="text-gray-600">
                      {booking?.flightDetails?.departureTime
                        ? new Date(booking.flightDetails.departureTime).toLocaleTimeString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="mt-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Important Information</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Please arrive at the airport at least 2 hours before departure</li>
                      <li>• Valid ID/Passport required for check-in</li>
                      <li>• Baggage allowance: {booking?.flightDetails?.baggage || '20kg'}</li>
                    </ul>
                  </div>
                </div>

                {/* QR Code */}
                <div className="mt-6 flex justify-center">
                  <div className="text-center">
                    <QRCodeSVG
                      value={`FLIGHT-${booking?.id}`}
                      size={128}
                      level="H"
                      includeMargin={true}
                    />
                    <p className="text-sm text-gray-500 mt-2">Scan for mobile boarding pass</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Generated on: {new Date().toLocaleString()}
                </p>
                <button
                  onClick={downloadETicket}
                  className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                >
                  <FaDownload className="mr-2" />
                  Download E-Ticket
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ETicketModal; 
