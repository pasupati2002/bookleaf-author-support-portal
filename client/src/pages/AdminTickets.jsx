import { useState } from 'react';
import { usePolling } from '../usePolling';
import { api } from '../api';

export default function AdminTickets({ onSelectTicket }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState('date-desc');
  const [priorityOrder, setPriorityOrder] = useState('desc');

  const {
    data: tickets,
    error,
    refresh
  } = usePolling(
    () => api('/admin/tickets'),
    5000
  );

  
const ticketList = (tickets || []).filter(ticket => {
  const matchesStatus =
    statusFilter === 'All' || ticket.status === statusFilter;

  const matchesCategory =
    categoryFilter === 'All' || ticket.category === categoryFilter;

  const matchesPriority =
    priorityFilter === 'All' || ticket.priority === priorityFilter;

    const matchesDate =
  !dateFilter ||
  (ticket.createdAt &&
    new Date(ticket.createdAt).toLocaleDateString('en-CA') === dateFilter);

  return matchesStatus && matchesCategory && matchesPriority && matchesDate;
});


const searchedTickets = ticketList.filter(ticket => {
  const query = searchTerm.trim().toLowerCase();

  if (!query) return true;

  return [
    ticket._id,
    ticket.subject,
    ticket.description,
    ticket.category,
    ticket.priority,
    ticket.status,
  ].some(field =>
    String(field ?? '').toLowerCase().includes(query)
  );
});


const sortedTickets = [...searchedTickets].sort((a, b) => {
  if (sortBy === 'date-desc' || sortBy === 'date-asc') {
    const dateA = a.createdAt
      ? new Date(a.createdAt).getTime()
      : 0;

    const dateB = b.createdAt
      ? new Date(b.createdAt).getTime()
      : 0;

    return sortBy === 'date-desc'
      ? dateB - dateA
      : dateA - dateB;
  }

  const priorityRank = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  const rankA = priorityRank[a.priority] || 0;
  const rankB = priorityRank[b.priority] || 0;

  return priorityOrder === 'desc'
    ? rankB - rankA
    : rankA - rankB;
});




  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Admin Ticket Queue</h2>
          <p>Manage author support requests.</p>
        </div>

        <button
          className="secondary-button"
          onClick={refresh}
        >
          Refresh
        </button>
      </div>

      
<div className="ticket-filters">
  <label>
    Sort by:
    <select
      value={sortBy}
      onChange={event => setSortBy(event.target.value)}
    >
      <option value="date-desc">Newest first</option>
      <option value="date-asc">Oldest first</option>
      <option value="priority">Priority</option>
    </select>
  </label>

  {sortBy === 'priority' && (
    <label>
      Priority order:
      <select
        value={priorityOrder}
        onChange={event => setPriorityOrder(event.target.value)}
      >
        <option value="desc">Highest first</option>
        <option value="asc">Lowest first</option>
      </select>
    </label>
  )}
</div>


      
<div className="ticket-filters">
  <label>
    Search tickets:
    <input
      type="search"
      placeholder="Search ID, subject, or description..."
      value={searchTerm}
      onChange={event => setSearchTerm(event.target.value)}
    />
  </label>

  {searchTerm && (
    <button
      type="button"
      className="secondary-button"
      onClick={() => setSearchTerm('')}
    >
      Clear search
    </button>
  )}
</div>


      <div className="ticket-filters">
  <label>
    Filter by status:
    <select
      value={statusFilter}
      onChange={event => setStatusFilter(event.target.value)}
    >
      <option value="All">All statuses</option>
      <option value="Open">Open</option>
      <option value="In Progress">In Progress</option>
      <option value="Resolved">Resolved</option>
      <option value="Closed">Closed</option>
    </select>
  </label>
</div>


<div className="ticket-filters">
  <label>
    Filter by category:
    <select
      value={categoryFilter}
      onChange={event => setCategoryFilter(event.target.value)}
    >
      <option value="All">All categories</option>
      <option value="Royalty & Payments">Royalty & Payments</option>
      <option value="ISBN & Metadata Issues">ISBN & Metadata Issues</option>
      <option value="Printing & Quality">Printing & Quality</option>
      <option value="Distribution & Availability">Distribution & Availability</option>
      <option value="Book Status & Production Updates">Book Status & Production Updates</option>
      <option value="General Inquiry">General Inquiry</option>
    </select>
  </label>
</div>


<div className="ticket-filters">
  <label>
    Filter by priority:
    <select
      value={priorityFilter}
      onChange={event => setPriorityFilter(event.target.value)}
    >
      <option value="All">All priorities</option>
      <option value="Critical">Critical</option>
      <option value="High">High</option>
      <option value="Medium">Medium</option>
      <option value="Low">Low</option>
    </select>
  </label>
</div>


<div className="ticket-filters">
  <label>
    Filter by date:
    <input
      type="date"
      value={dateFilter}
      onChange={event => setDateFilter(event.target.value)}
    />
  </label>
</div>




      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {searchedTickets.length === 0 && !error ? (
        <div className="empty-state">
          <h3>No tickets found</h3>
          <p>There are currently no support tickets.</p>
        </div>
      ) : (
        <div className="ticket-list">
          {sortedTickets.map(ticket => (
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
    </div>
  );
}
