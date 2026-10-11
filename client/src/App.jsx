import { useState } from 'react';

import Login from './pages/Login';
import Books from './pages/Books';
import Tickets from './pages/Tickets';
import NewTicket from './pages/NewTicket';
import TicketDetail from './pages/TicketDetail';
import AdminTickets from './pages/AdminTickets';
import AdminTicketDetail from './pages/AdminTicketDetail';

import './App.css';

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');

    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [page, setPage] = useState('tickets');
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  function handleLogin(loggedInUser) {
    setUser(loggedInUser);
    setPage('tickets');
  }

  function handleLogout() {
    localStorage.clear();
    setUser(null);
    setSelectedTicketId(null);
  }

  function openTicket(ticketId) {
    setSelectedTicketId(ticketId);
    setPage('ticket-detail');
  }

  function openAdminTicket(ticketId) {
  setSelectedTicketId(ticketId);
  setPage('admin-ticket-detail');
}

  function showTickets() {
    setSelectedTicketId(null);
    setPage('tickets');
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>BookLeaf Support Portal</h1>
          <p>Welcome, {user.name || user.email}</p>
        </div>

        <button
          className="secondary-button"
          onClick={handleLogout}
        >
          Sign out
        </button>
      </header>

      <nav className="app-nav">
        <button
          className={page === 'tickets' ? 'active' : ''}
          onClick={showTickets}
        >
          Tickets
        </button>

        <button
          className={page === 'books' ? 'active' : ''}
          onClick={() => {
            setSelectedTicketId(null);
            setPage('books');
          }}
        >
          My Books
        </button>

        <button
          className={page === 'new-ticket' ? 'active' : ''}
          onClick={() => {
            setSelectedTicketId(null);
            setPage('new-ticket');
          }}
        >
          New Ticket
        </button>

        {user.role === 'admin' && (
          <button
            className={page === 'admin-tickets' ? 'active' : ''}
            onClick={() => {
              setSelectedTicketId(null);
              setPage('admin-tickets');
            }}
          >
            Admin Tickets
          </button>
        )}
      </nav>

      <main className="app-content">
        {user.role === 'admin' && page === 'admin-tickets' && (
          <AdminTickets onSelectTicket={openAdminTicket} />
        )}

        {page === 'tickets' && (
          <Tickets
            onSelectTicket={openTicket}
            onNewTicket={() => setPage('new-ticket')}
          />
        )}

        {page === 'books' && <Books />}

        {page === 'new-ticket' && (
          <NewTicket />
        )}

        {page === 'ticket-detail' && selectedTicketId && (
          <TicketDetail
            ticketId={selectedTicketId}
            onBack={showTickets}
          />
        )}
        {user.role === 'admin' &&
  page === 'admin-ticket-detail' &&
  selectedTicketId && (
    <AdminTicketDetail
      ticketId={selectedTicketId}
      onBack={() => setPage('admin-tickets')}
    />
)}
      </main>
    </div>
  );
}