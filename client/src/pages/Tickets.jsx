import { usePolling } from '../usePolling';
import { api } from '../api';

export default function Tickets({ onSelectTicket, onNewTicket }) {
  const {
    data: tickets,
    error,
    refresh
  } = usePolling(
    () => api('/tickets'),
    5000
  );

  const ticketList = tickets || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>My Support Tickets</h2>
          <p>Track your support requests and replies.</p>
        </div>

        <button onClick={onNewTicket}>
          New Ticket
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {ticketList.length === 0 && !error ? (
        <div className="empty-state">
          <h3>No tickets yet</h3>
          <p>Create a ticket if you need help from BookLeaf Support.</p>

          <button onClick={onNewTicket}>
            Create Your First Ticket
          </button>
        </div>
      ) : (
        <div className="ticket-list">
          {ticketList.map(ticket => (
            <button
              className="ticket-card"
              key={ticket._id}
              onClick={() => onSelectTicket(ticket._id)}
            >
              <div className="ticket-card-top">
                <h3>{ticket.subject}</h3>

                <span className={`status status-${ticket.status}`}>
                  {ticket.status}
                </span>
              </div>

              <p className="ticket-description">
                {ticket.description}
              </p>

              <div className="ticket-meta">
                <span>
                  Category: {ticket.category || 'Pending'}
                </span>

                <span>
                  Priority: {ticket.priority || 'Pending'}
                </span>

                <span>
                  Updated:{' '}
                  {ticket.updatedAt
                    ? new Date(ticket.updatedAt).toLocaleString()
                    : 'Unknown'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <button
        className="secondary-button"
        onClick={refresh}
      >
        Refresh
      </button>
    </div>
  );
}