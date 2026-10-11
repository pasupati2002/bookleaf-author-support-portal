# BookLeaf Portal

A full-stack author support portal for BookLeaf Publishing. Authors can view their books and royalty information, submit support tickets, and communicate with the support team. Administrators can manage tickets, update their status and priority, add internal notes, and generate AI-assisted replies.

## Features

### Author Portal
- Author login and authentication.
- View books and royalty information.
- Create and view support tickets.
- View support responses and ticket conversations.

### Admin Portal
- View and manage support tickets.
- Filter tickets by status, category, priority, and creation date.
- Update ticket category, priority, and status.
- Add internal notes and public replies.
- Generate AI-assisted ticket classifications and draft replies.

### Technical Features
- React frontend built with Vite.
- Node.js and Express backend.
- MongoDB database with Mongoose.
- JWT-based authentication.
- AI-assisted classification and reply drafting using Ollama.

## Technology Stack

- Frontend: React, Vite, JavaScript
- Backend: Node.js, Express
- Database: MongoDB, Mongoose
- Authentication: JWT and bcrypt
- Validation: Zod
- AI: Ollama with the `llama3.2:3b` model

## Project Structure

- `client/` — React frontend
- `server/` — Express backend, database models, API routes, and AI functionality

## Local Development

### Prerequisites

- Node.js and npm
- MongoDB connection string
- Ollama installed with the configured model available locally

### Environment Configuration

Create a `server/.env` file with the environment variables required by the backend. Refer to the backend configuration and do not commit secrets to Git.

Required configuration includes the MongoDB connection string, JWT secret, and AI model settings. If using a remote AI service instead of local Ollama, configure its credentials securely on the server.

### Run the Backend

Open a terminal:

```bash
cd server
npm install
node src/server.js
```

### Run the Frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite in the terminal.

## API Documentation

Base URL during local development: `http://127.0.0.1:5000`

Protected endpoints require this HTTP header:

`Authorization: Bearer <token>`

### Authentication

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Log in using email and password; returns a JWT token |

Example request:

```json
{
  "email": "author@example.com",
  "password": "your-password"
}
```

### Books

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/books` | Authenticated | List books; authors see their own books, admins see all books |

### Tickets

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/tickets` | Author | Create a ticket; optionally include a book ID and attachment |
| GET | `/api/tickets` | Authenticated | List tickets; authors see their own tickets |
| GET | `/api/tickets/:id` | Authenticated | Get ticket details and conversation |
| PATCH | `/api/tickets/:id` | Admin | Update ticket status, category, priority, or assignee |
| POST | `/api/tickets/:id/messages` | Authenticated | Add a public conversation message |
| POST | `/api/tickets/:id/internal-notes` | Admin | Add an internal-only note |
| GET | `/api/tickets/:id/attachment` | Ticket owner or admin | Download a ticket attachment |
| POST | `/api/tickets/:id/ai-draft` | Admin | Generate an AI reply draft |
| POST | `/api/admin/tickets/:id/draft-reply` | Admin | Generate an AI reply draft using the support knowledge base |
| GET | `/api/admin/tickets` | Admin | List tickets, optionally filtered by status, priority, or category |

### Health Check

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Check whether the API is running |

### Ticket Creation

The ticket creation endpoint accepts `multipart/form-data` so an author can attach a file.

Fields:
- `subject` — required, at least 3 characters
- `description` — required, at least 5 characters
- `book_id` — optional
- `attachment` — optional; PDF, JPG, PNG, DOC, or DOCX, up to 5 MB

### Common Error Responses

- `400 Bad Request` — invalid request data
- `401 Unauthorized` — missing, invalid, or expired token
- `403 Forbidden` — insufficient permissions
- `404 Not Found` — ticket, attachment, or route not found
- `500 Internal Server Error` — unexpected server error

Responses may include a JSON `error` message describing the problem.

## AI Implementation

The application uses Ollama with the `llama3.2:3b` model for ticket classification and AI-assisted reply drafting.

AI-generated replies should be reviewed by an administrator before being sent to an author. The system should avoid inventing policy details, royalty amounts, payment dates, or production information when those details are unavailable.

## Security Notes

- Keep environment files and API credentials out of version control.
- Use authentication and role-based authorization for protected endpoints.
- Never expose authentication tokens or server-side secrets in logs or frontend code.

## Limitations

- Local AI inference requires Ollama and the configured model to be running.
- A deployment environment must provide a reachable AI service; a locally running Ollama instance is not automatically available to a hosted backend.
- AI-generated classifications and replies may require administrator correction or review.

## Project Status

Core author and admin ticket workflows, ticket filtering, and AI-assisted support features have been implemented. Further testing, API documentation, and deployment verification remain part of the project completion process.
