import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Books() {
  const [books, setBooks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/books')
      .then(setBooks)
      .catch(error => setError(error.message));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>My Books</h2>
          <p>View your published books and royalty information.</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {books.length === 0 && !error ? (
        <p>No books found.</p>
      ) : (
        <div className="book-grid">
          {books.map(book => (
            <div className="book-card" key={book.book_id}>
              <h3>{book.title}</h3>

              <p>
                <strong>Status:</strong> {book.status}
              </p>

              <p>
                <strong>ISBN:</strong> {book.isbn}
              </p>

              <p>
                <strong>Copies sold:</strong>{' '}
                {book.total_copies_sold ?? 0}
              </p>

              <p>
                <strong>Royalty earned:</strong> ₹
                {book.total_royalty_earned ?? 0}
              </p>

              <p>
                <strong>Royalty paid:</strong> ₹
                {book.royalty_paid ?? 0}
              </p>

              <p>
                <strong>Royalty pending:</strong> ₹
                {book.royalty_pending ?? 0}
              </p>

              <p>
                <strong>Available on:</strong>{' '}
                {(book.available_on || []).join(', ') || 'Not listed'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}