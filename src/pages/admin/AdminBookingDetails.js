const AdminBookingDetails = () => {
  // ... existing state and useEffect ...

  const formatSeatInfo = (passenger) => {
    if (!passenger.seatNumber) return 'Not assigned';
    const seatClass = {
      'E': 'Economy',
      'B': 'Business',
      'F': 'First'
    }[passenger.seatNumber.charAt(0)];
    return `${seatClass} - ${passenger.seatNumber}`;
  };

  // ... rest of the component remains the same until the passenger information section ...

  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Passenger Information</h3>
    <div className="space-y-4">
      {booking?.passengers?.map((passenger, index) => (
        <div key={index} className="flex items-center justify-between">
          <div>
            <div className="font-semibold">
              {passenger.firstName} {passenger.lastName}
            </div>
            <div className="text-sm text-gray-500">
              {passenger.type} - {formatSeatInfo(passenger)}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {passenger.specialRequests && `Special Requests: ${passenger.specialRequests}`}
          </div>
        </div>
      ))}
    </div>
  </div>

  // ... rest of the component remains the same ...
} 