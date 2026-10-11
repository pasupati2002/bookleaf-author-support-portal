import { useState } from 'react';
import { api } from '../api';
import { usePolling } from '../usePolling';

export default function TicketDetail({ ticketId, onBack }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const {
    data: ticket,
    error,
    refresh
  } = usePolling(
    () => api(`/tickets/${ticketId}`),
    4000,
    [ticketId]
  );

  async function handleSubmit(event) {
    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    setSendError('');
    setSending(true);

    try {
      await api(`/tickets/${ticketId}/messages`, 'POST', {
        body: message.trim()
      });

      setMessage('');
      await refresh();
    } catch (error) {
      setSendError(error.message);
    } finally {
      setSending(false);
    }
  }

  if (error) {
    return (
      <div>
        <button onClick={onBack}>← Back to Tickets</button>

        <div className="error-message">
          {error}
        </div>
      </div>
    );
  }

  if (!ticket) {
    return <p>Loading ticket...</p>;
  }

  return (
    <div>
      <button
        className="secondary-button"
        onClick={onBack}
      >
        ← Back to Tickets
      </button>

      <div className="ticket-detail-header">
        <div>
          <h2>{ticket.subject}</h2>
          <p>{ticket.description}</p>
        </div>

        <div className="ticket-detail-status">
          <span className={`status status-${ticket.status}`}>
            {ticket.status}
          </span>

          <span>
            {ticket.priority || 'Priority pending'}
          </span>
        </div>
      </div>

      <div className="ticket-info">
        <span>
          <strong>Category:</strong>{' '}
          {ticket.category || 'Pending'}
        </span>

        <span>
          <strong>Status:</strong>{' '}
          {ticket.status}
        </span>

        <span>
          <strong>Created:</strong>{' '}
          {ticket.createdAt
            ? new Date(ticket.createdAt).toLocaleString()
            : 'Unknown'}
        </span>
      </div>

      <div className="conversation">
        <h3>Conversation</h3>

        {ticket.messages?.length ? (
          ticket.messages.map((message, index) => (
            <div
              className={`message ${
                message.senderRole === 'author'
                  ? 'message-author'
                  : 'message-support'
              }`}
              key={message._id || index}
            >
              <div className="message-header">
                <strong>
                  {message.senderRole === 'author'
                    ? 'You'
                    : 'BookLeaf Support'}
                </strong>

                <span>
                  {message.createdAt
                    ? new Date(
                        message.createdAt
                      ).toLocaleString()
                    : ''}
                </span>
              </div>

              <p>{message.body}</p>
            </div>
          ))
        ) : (
          <p>No replies yet.</p>
        )}
      </div>

      <div className="reply-card">
        <h3>Send a Reply</h3>

        <form onSubmit={handleSubmit}>
          <textarea
            value={message}
            onChange={event =>
              setMessage(event.target.value)
            }
            placeholder="Write your reply..."
            rows="5"
            required
          />

          {sendError && (
            <div className="error-message">
              {sendError}
            </div>
          )}

          <button type="submit" disabled={sending}>
            {sending ? 'Sending...' : 'Send Reply'}
          </button>
        </form>
      </div>
    </div>
  );
}