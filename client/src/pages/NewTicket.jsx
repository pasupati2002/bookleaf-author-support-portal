import { useEffect, useState } from 'react';
import { api } from '../api';

export default function NewTicket() {
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api('/books')
      .then(setBooks)
      .catch(error => setError(error.message));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSuccess('');
    setLoading(true);

    try {
const formData = new FormData();

if (bookId) {
  formData.append('book_id', bookId);
}

formData.append('subject', subject);
formData.append('description', description);

if (attachment) {
  formData.append('attachment', attachment);
}

await api('/tickets', 'POST', formData);

      setSubject('');
      setDescription('');
      setBookId('');

      setSuccess(
        'Ticket created successfully. Our support team will review it.'
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Create Support Ticket</h2>
          <p>Tell us what you need help with.</p>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <label>
            Book
            <select
              value={bookId}
              onChange={event => setBookId(event.target.value)}
            >
              <option value="">Account-level issue</option>

              {books.map(book => (
                <option key={book.book_id} value={book.book_id}>
                  {book.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            Subject
            <input
              value={subject}
              onChange={event => setSubject(event.target.value)}
              placeholder="What do you need help with?"
              required
              minLength={3}
            />
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="Describe your issue in detail..."
              rows="7"
              required
              minLength={5}
            />
          </label>

          <label>
  Attachment (optional)
  <input
    type="file"
    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
    onChange={event =>
      setAttachment(event.target.files?.[0] || null)
    }
  />
</label>

{attachment && (
  <p>Selected file: {attachment.name}</p>
)}

          {error && <div className="error-message">{error}</div>}

          {success && <div className="success-message">{success}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Creating ticket...' : 'Create Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
}