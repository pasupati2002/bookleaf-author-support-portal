# BookLeaf Author Support Portal

A full-stack author support portal for BookLeaf Publishing. Authors can view their books and royalty information, submit support tickets, and communicate with the support team. Administrators can manage tickets, update statuses and priorities, add internal notes, and generate AI-assisted replies.

## Live Demo

- **Frontend:** https://bookleaf-author-support-portal-murex.vercel.app/
- **Backend health check:** https://bookleaf-author-support-portal-zre9.onrender.com/api/health
- **GitHub repository:** https://github.com/pasupati2002/bookleaf-author-support-portal

### Demo Credentials

**Admin account**
- Email: `admin@bookleaf.com`
- Password: `Admin@123`

**Author account**
- Email: Replace with the actual email of the author account you verified
- Password: `Author@123`

These are demonstration credentials only. Do not reuse them for real accounts. Change or disable demo credentials before using the application with real customer data.

## Features

### Author Portal
- Log in using email and password.
- View books and royalty information associated with the authenticated author.
- Create support tickets associated with a book or a general inquiry.
- View ticket status, replies, and conversation history.
- Reply to support messages and attach supported files when creating a ticket.

### Admin Portal
- View and manage support tickets.
- Filter tickets by status, category, and priority.
- Review ticket priorities, with Critical and High tickets ordered before lower-priority tickets.
- Update ticket category, priority, status, and assignee.
- Add internal notes that are hidden from authors.
- Send public replies to authors.
- Generate AI-assisted ticket classifications and draft replies.

### Technical Features
- React frontend built with Vite.
- Node.js and Express REST API.
- MongoDB database with Mongoose.
- JWT-based authentication and role-based access control.
- Password hashing with bcrypt.
- Request validation with Zod.
- Optional ticket attachments with file-type and size restrictions.
- AI-assisted classification and reply drafting.

## Technology Stack

- **Frontend:** React, Vite, JavaScript
- **Backend:** Node.js, Express
- **Database:** MongoDB, Mongoose
- **Authentication:** JWT, bcrypt
- **Validation:** Zod
- **AI:** Ollama with `llama3.2:3b` for local inference; an alternative hosted provider can be configured through server-side environment variables.

## Project Structure

- `client/` — React frontend and user interface.
- `server/` — Express backend, database models, authentication, API routes, and AI functionality.
- `server/data/bookleaf_sample_data.json` — Sample author and book dataset.
- `server/src/seed.js` — Database seeding script.
- `ASSIGNMENT_WRITEUP.md` — Assignment priorities, trade-offs, and proposed production improvements.

## Local Development

### Prerequisites

- Node.js and npm.
- A MongoDB connection string.
- Ollama installed locally with the configured model available, if using local AI inference.

### Environment Configuration

Create `server/.env` with the required configuration. Do not commit environment files or credentials to Git.

Configure the MongoDB connection string, JWT secret, and AI provider/model settings. If using a hosted AI provider, configure its API key securely on the server.

Local Ollama inference does not incur a per-request model API fee, but it requires local compute resources. Hosted AI providers may charge for usage.

### Run the Backend

Open a terminal in the project root:

```bash
cd server
npm install
node src/server.js
```

Ensure the required environment variables are configured and the MongoDB database is reachable.

### Run the Frontend

Open a second terminal in the project root:

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite.

For the deployed frontend, configure `VITE_API_URL` to point to the backend base URL, without the trailing `/api` path if the frontend appends `/api` itself.

## API Documentation

### Base URLs

Local backend:

`http://127.0.0.1:5000`

Production backend:

`https://bookleaf-author-support-portal-zre9.onrender.com`

Protected endpoints require this HTTP header:

```http
Authorization: Bearer <token>
```

### Authentication

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Authenticate with email and password; return a JWT |

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
| GET | `/api/books` | Authenticated | List books; authors see only their own books, while admins can see all books |

### Tickets

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/tickets` | Author | Create a support ticket, optionally with an attachment |
| GET | `/api/tickets` | Authenticated | List tickets; authors see their own tickets |
| GET | `/api/tickets/:id` | Authenticated | Retrieve ticket details and permitted conversation messages |
| PATCH | `/api/tickets/:id` | Admin | Update ticket status, category, priority, or assignee |
| POST | `/api/tickets/:id/messages` | Authenticated | Add a public conversation message |
| POST | `/api/tickets/:id/internal-notes` | Admin | Add an internal-only note |
| GET | `/api/tickets/:id/attachment` | Ticket owner or admin | Download a ticket attachment |
| POST | `/api/tickets/:id/ai-draft` | Admin | Generate an AI reply draft |
| GET | `/api/admin/tickets` | Admin | List tickets, optionally filtered by status, priority, or category |

### Health Check

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Check whether the backend API is running |

### Ticket Creation

The ticket creation endpoint accepts `multipart/form-data`.

Fields:
- `subject` — required, at least 3 characters.
- `description` — required, at least 5 characters.
- `book_id` — optional; if provided, it must belong to the authenticated author.
- `attachment` — optional; supported file types include PDF, JPG, PNG, DOC, and DOCX, up to 5 MB.

### Common Error Responses

- `400 Bad Request` — invalid request data.
- `401 Unauthorized` — missing, invalid, or expired token.
- `403 Forbidden` — insufficient permissions.
- `404 Not Found` — requested resource or route not found.
- `500 Internal Server Error` — unexpected server error.

Responses may include a JSON `error` message describing the problem.

## AI Implementation

The AI module supports ticket classification and reply drafting.

Classification proposes a ticket category and priority from the subject and description. The supported categories are Royalty & Payments, ISBN & Metadata Issues, Printing & Quality, Distribution & Availability, Book Status & Production Updates, and General Inquiry. Administrators can correct classifications and priorities.

Reply drafting uses ticket information, relevant book details, conversation history, and a support knowledge base. Drafts are intended to assist support staff rather than replace their judgment. Administrators must review and edit AI-generated replies before sending them.

### Reliability and Cost Management

- The AI provider is selected through server-side environment configuration.
- Local Ollama inference is the preferred zero-per-request-model-API-cost option for development.
- Hosted AI providers may incur charges and should only be enabled deliberately.
- If classification fails, ticket creation can continue using fallback values.
- If reply drafting fails, the administrator can write a response manually.
- Prompts should avoid inventing royalty amounts, payment dates, ISBN outcomes, or production updates when those details are unavailable.

A hosted backend cannot automatically access an Ollama instance running on a developer's computer. Production AI requires a reachable inference service or a deliberately configured hosted provider.

## Security Notes

- Keep `.env` files, JWT secrets, and API keys out of version control.
- Use authentication and role-based authorization for protected endpoints.
- Restrict authors to their own book and ticket data.
- Keep internal notes hidden from author-facing responses.
- Validate user input and uploaded file types and sizes.
- Never expose authentication tokens or server-side secrets in logs or frontend code.

## Sample Data and Seeding

The repository includes a sample dataset at `server/data/bookleaf_sample_data.json` and a seed script at `server/src/seed.js`.

The sample JSON dataset contains 10 authors and 18 books. The seed script is intended to create demo user accounts and populate book records.

**Important:** Review the seed script and database target before running it. Seeding a database can insert or update records, and existing user passwords may not be reset by the script. Do not run it against production without confirming the intended effects and obtaining a backup.

## Limitations and Future Improvements

- Local AI inference requires Ollama and the configured model to be available.
- The hosted AI configuration must be verified independently of local development.
- AI classifications and replies may require administrator correction.
- Automated tests, more comprehensive audit logging, rate limiting, attachment scanning, and operational monitoring should be expanded before production use.
- More advanced analytics, richer date-based queue filtering, and formal production data-retention policies are potential improvements.

## Project Status

The core author and admin workflows have been implemented. The frontend production build and backend syntax checks passed during development, and the deployed author and admin logins were verified. The live ticket queue was also checked after the latest backend update.

The project is intended as a technical assignment demonstration, not a fully hardened production service.
