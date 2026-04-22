import './App.css';
import Tickets from './pages/Tickets';

function App() {
  const isTicketsPage = window.location.pathname === '/tickets';

  if (isTicketsPage) {
    return <Tickets />;
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
      </header>
    </div>
  );
}

export default App;
