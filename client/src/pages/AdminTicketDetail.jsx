import { useState } from 'react';
import { usePolling } from '../usePolling';
import { api } from '../api';

export default function AdminTicketDetail({ ticketId, onBack }) {
  const [aiDraft, setAiDraft] = useState('');
const [aiLoading, setAiLoading] = useState(false);
const [aiError, setAiError] = useState('');
  const {
    data: ticket,
    error
  } = usePolling(
    () => api(`/tickets/${ticketId}`),
    4000,
    [ticketId]
  );

  if (error) {
    return (
      <div>
        <button
          className="secondary-button"
          onClick={onBack}
        >
          ← Back to Admin Tickets
        </button>

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
        ← Back to Admin Tickets
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

      

{ticket.attachment && (
  <div className="ticket-info">
    <strong>Attachment:</strong>{' '}
    {ticket.attachment.originalName}
    <span>
      ({Math.round(ticket.attachment.size / 1024)} KB)
    </span>

    <button
      type="button"
      onClick={async () => {
        try {
          const response = await fetch(
            `/api/tickets/${ticket._id}/attachment`,
            {
              headers: {
                Authorization: 'Bearer ' + localStorage.token
              }
            }
          );

          if (!response.ok) {
            throw new Error('Download failed');
          }

          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');

          link.href = url;
          link.download = ticket.attachment.originalName;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
        } catch (error) {
          alert('Unable to download attachment. Please try again.');
        }
      }}
    >
      Download Attachment
    </button>
  </div>
)}



      <div className="admin-controls">
        <label>
          Status
          <select
            value={ticket.status}
            onChange={async event => {
              try {
                await api(`/tickets/${ticketId}`, 'PATCH', {
                  status: event.target.value
                });

                window.location.reload();
              } catch (error) {
                alert(error.message);
              }
            }}
          >
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </label>

        <label>
          Category
          <select
            value={ticket.category || 'General Inquiry'}
            onChange={async event => {
              try {
                await api(`/tickets/${ticketId}`, 'PATCH', {
                  category: event.target.value
                });

                window.location.reload();
              } catch (error) {
                alert(error.message);
              }
            }}
          >
<option value="Royalty & Payments">Royalty & Payments</option>
<option value="ISBN & Metadata Issues">ISBN & Metadata Issues</option>
<option value="Printing & Quality">Printing & Quality</option>
<option value="Distribution & Availability">Distribution & Availability</option>
<option value="Book Status & Production Updates">Book Status & Production Updates</option>
<option value="General Inquiry">General Inquiry</option>

          </select>
        </label>

        <label>
          Priority
          <select
            value={ticket.priority || 'Medium'}
            onChange={async event => {
              try {
                await api(`/tickets/${ticketId}`, 'PATCH', {
                  priority: event.target.value
                });

                window.location.reload();
              } catch (error) {
                alert(error.message);
              }
            }}
          >
<option value="Critical">Critical</option>
<option value="High">High</option>
<option value="Medium">Medium</option>
<option value="Low">Low</option>

          </select>
        </label>

        <label>
          Assigned To
          <select
            value={ticket.assignedTo?._id || ''}
            onChange={async event => {
              try {
                await api(`/tickets/${ticketId}`, 'PATCH', {
                  assignedTo: event.target.value || null
                });

                window.location.reload();
              } catch (error) {
                alert(error.message);
              }
            }}
          >
            <option value="">Unassigned</option>

            <option value="6ac72196633ddd744f436263">
              BookLeaf Admin
            </option>
          </select>
        </label>
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
                message.internal
                  ? 'message-internal'
                  : message.senderRole === 'author'
                    ? 'message-author'
                    : 'message-support'
              }`}
              key={message._id || index}
            >
              <div className="message-header">
                <strong>
                  {message.internal
                    ? 'Internal Note'
                    : message.senderRole === 'author'
                      ? 'Author'
                      : 'BookLeaf Support'}
                </strong>

                <span>
                  {message.createdAt
                    ? new Date(message.createdAt).toLocaleString()
                    : ''}
                </span>
              </div>

              <p>{message.body}</p>
            </div>
          ))
        ) : (
          <p>No messages yet.</p>
        )}
      </div>

      <div className="reply-card">
        <h3>Internal Note</h3>

        <form
          onSubmit={async event => {
            event.preventDefault();

            const body = event.target.elements.note.value.trim();

            if (!body) {
              return;
            }

            try {
              await api(
                `/tickets/${ticketId}/internal-notes`,
                'POST',
                {
                  body
                }
              );

              event.target.reset();
              window.location.reload();
            } catch (error) {
              alert(error.message);
            }
          }}
        >
          <textarea
            name="note"
            placeholder="Add a private note for the support team..."
            rows="4"
            required
          />

          <button type="submit">
            Add Internal Note
          </button>
        </form>
      </div>
      <div className="reply-card">
  <h3>Reply to Author</h3>
<button
  type="button"
  disabled={aiLoading}
  onClick={async () => {
    setAiError('');
    setAiLoading(true);

    try {
      const result = await api(
  `/admin/tickets/${ticketId}/draft-reply`,
  'POST'
);

      setAiDraft(result.draft);
    } catch (error) {
      setAiError(error.message);
    } finally {
      setAiLoading(false);
    }
  }}
>
  {aiLoading ? 'Generating...' : 'Generate AI Draft'}
</button>
  {aiError && (
    <div className="error-message">
      {aiError}
    </div>
  )}

  {aiDraft && (
    <textarea
      value={aiDraft}
      onChange={event => setAiDraft(event.target.value)}
      rows="6"
      placeholder="AI-generated draft..."
    />
  )}
  <form
    onSubmit={async event => {
      event.preventDefault();

      const body = event.target.elements.reply.value.trim();

      if (!body) {
        return;
      }

      try {
        await api(`/tickets/${ticketId}/messages`, 'POST', {
          body
        });

        event.target.reset();
        window.location.reload();
      } catch (error) {
        alert(error.message);
      }
    }}
  >
   <textarea
  name="reply"
  value={aiDraft}
  onChange={event => setAiDraft(event.target.value)}
  placeholder="Write a reply to the author..."
  rows="5"
  required
/>

    <button type="submit">
      Send Reply
    </button>
  </form>
</div>
    </div>
  );
}