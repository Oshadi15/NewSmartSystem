import './App.css';
import Tickets from './pages/Tickets.js';

import Booking from './pages/Booking';
import MyBookings from './pages/MyBookings';

function App() {
  const isTicketsPage = window.location.pathname === '/tickets';
  const isBookingPage = window.location.pathname === '/booking';
  const isMyBookingsPage = window.location.pathname === '/mybookings';

  if (isTicketsPage) {
    return <Tickets />;
  }

   if (isBookingPage) {
    return <Booking />;
  }

  if (isMyBookingsPage) {
    return <MyBookings />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Smart Campus frontend is running.
        </p>
        <a className="App-link" href="/tickets">
          Open Tickets Page
        </a>
         <a className="App-link" href="/booking">
          Open Booking Page
        </a>
        <br />
        <a className="App-link" href="/mybookings">
          Open My Bookings Page
        </a>
      </header>
    </div>
  );
}


export default App;
