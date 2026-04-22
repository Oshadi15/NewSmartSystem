import React from 'react';
import BookingForm from '../components/BookingForm';

const Booking = () => (
  <>
    {/* Page header */}
    <div className="page-header">
      <h1 className="page-title">📅 Book a Resource</h1>
      <p className="page-subtitle">
        Fill in the details below to reserve a campus resource.
        Your request will be reviewed and you'll receive a notification once approved or rejected.
      </p>
    </div>

    {/* Constrain form width for readability */}
    <div style={{ maxWidth: 700 }}>
      <BookingForm />
    </div>
  </>
);

export default Booking;
