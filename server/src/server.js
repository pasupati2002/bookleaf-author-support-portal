require('dotenv').config();

const path = require('path');
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { z } = require('zod');

const { User, Book, Ticket, STATUSES } = require('./models');
const { classifyTicket, draftReply } = require('./ai');

const app = express();
const fs = require('fs');

const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(-100);

    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, PNG, DOC, and DOCX files are allowed.'));
    }
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI is missing from .env');
}

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is missing from .env');
}

console.log('BookLeaf server configuration loaded');

app.post('/api/auth/login', async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1)
    });

    const { email, password } = schema.parse(req.body);

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        author_id: user.author_id || null
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        author_id: user.author_id || null
      }
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid login data' });
    }

    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

function auth(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = header.slice(7);

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = payload;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

app.get('/api/books', auth, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const books = await Book.find().sort({ title: 1 });
      return res.json(books);
    }

    const books = await Book.find({
      author_id: req.user.author_id
    }).sort({ title: 1 });

    res.json(books);
  } catch (error) {
    console.error('Books error:', error);
    res.status(500).json({ error: 'Failed to load books' });
  }
});

app.post(
  '/api/tickets',
  auth,
  upload.single('attachment'),
  async (req, res) => {
  try {
    if (req.user.role !== 'author') {
      return res.status(403).json({
        error: 'Only authors can create tickets'
      });
    }

    const schema = z.object({
      book_id: z.string().optional(),
      subject: z.string().min(3),
      description: z.string().min(5)
    });

    const { book_id, subject, description } = schema.parse(req.body);

const attachment = req.file
  ? {
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    }
  : undefined;

    if (book_id) {
      const book = await Book.findOne({
        book_id,
        author_id: req.user.author_id
      });

      if (!book) {
        return res.status(400).json({
          error: 'Book not found'
        });
      }
    }

    const ticket = await Ticket.create({
  author_id: req.user.author_id,
  book_id: book_id || undefined,
  subject,
  description,
  attachment,
  status: 'Open'
});

    try {
      const result = await classifyTicket(subject, description);

      ticket.category = result.category;
      ticket.priority = result.priority;
      ticket.aiClassified = true;

      await ticket.save();
    } catch (aiError) {
      console.error('AI classification failed:', aiError.message);
    }

    res.status(201).json(ticket);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Invalid ticket data'
      });
    }

    console.error('Create ticket error:', error);
    res.status(500).json({
      error: 'Failed to create ticket'
    });
  }
});

app.get('/api/tickets', auth, async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === 'author') {
      filter.author_id = req.user.author_id;
    }

    const tickets = await Ticket.find(filter)
      .sort({ updatedAt: -1 })
      .populate('assignedTo', 'name email');

    res.json(tickets);
  } catch (error) {
    console.error('Tickets error:', error);
    res.status(500).json({ error: 'Failed to load tickets' });
  }
});

app.get('/api/tickets/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('assignedTo', 'name email');

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    if (
      req.user.role === 'author' &&
      ticket.author_id !== req.user.author_id
    ) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const result = ticket.toObject();

    // Authors must not see internal notes.
    if (req.user.role === 'author') {
      result.messages = result.messages.filter(
        message => !message.internal
      );
    }

    res.json(result);
  } catch (error) {
    console.error('Ticket detail error:', error);
    res.status(500).json({
      error: 'Failed to load ticket'
    });
  }
});

app.patch('/api/tickets/:id', auth, adminOnly, async (req, res) => {
  try {
    const schema = z.object({
      status: z.enum(STATUSES).optional(),
      category: z.string().optional(),
      priority: z.string().optional(),
      assignedTo: z.string().optional().nullable()
    });

    const updates = schema.parse(req.body);

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    ).populate('assignedTo', 'name email');

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    res.json(ticket);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Invalid ticket update'
      });
    }

    console.error('Update ticket error:', error);
    res.status(500).json({
      error: 'Failed to update ticket'
    });
  }
});

app.post('/api/tickets/:id/messages', auth, async (req, res) => {
  try {
    const schema = z.object({
      body: z.string().min(1)
    });

    const { body } = schema.parse(req.body);

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    if (
      req.user.role === 'author' &&
      ticket.author_id !== req.user.author_id
    ) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    ticket.messages.push({
      senderRole: req.user.role,
      senderId: req.user.id,
      body,
      internal: false
    });

    if (req.user.role === 'author' && ticket.status === 'Resolved') {
      ticket.status = 'Open';
    }

    await ticket.save();

    res.status(201).json(ticket);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Message cannot be empty'
      });
    }

    console.error('Message error:', error);
    res.status(500).json({
      error: 'Failed to add message'
    });
  }
});


app.post(
  '/api/admin/tickets/:id/draft-reply',
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const ticket = await Ticket.findById(req.params.id);

      if (!ticket) {
        return res.status(404).json({
          error: 'Ticket not found'
        });
      }

      const knowledgeBase = `
BookLeaf Support Knowledge Base

ROYALTY & PAYMENTS
- Authors receive 80% of net profit.
- Royalties are calculated quarterly.
- Payment is made within 45 days after the quarter ends.
- Minimum payout is Rs. 1,000. Smaller balances roll over.
- Payments are made by bank transfer.

ISBN & METADATA
- ISBNs are issued under the BookLeaf imprint.
- Wrong or duplicate ISBNs are high priority and must be escalated to production.
- ISBN issues should be addressed within 48 hours.

PRINTING & QUALITY
- Print turnaround is 5–7 business days.
- Verified print defects qualify for a free reprint.

DISTRIBUTION
- Distribution platforms may take 7–10 business days to list a book.
- Stock synchronization may take 24–48 hours.

RESPONSE STYLE
- Be empathetic and professional.
- Give specific timelines only when supported by this knowledge base.
- Explain the next steps clearly.
- Never invent an author's payment status, book status, or completed action.
- If account-specific information is missing, say the support team will verify it.
`;

      const prompt = `
You are a professional BookLeaf Publishing support agent.
Draft a response for an admin to review. Do not send the message.
Use only the supplied knowledge base for policy facts.
Do not claim that an action has been completed unless the ticket confirms it.
If information is missing, explain what needs to be checked.
Keep the reply concise, empathetic, and actionable.

KNOWLEDGE BASE:
${knowledgeBase}

TICKET:
Subject: ${ticket.subject}
Category: ${ticket.category || 'General Inquiry'}
Priority: ${ticket.priority || 'Medium'}
Description: ${ticket.description}

Return only the suggested reply text. Do not include a subject line.
`;

      const draft = await askOllama(prompt);

      if (!draft || !draft.trim()) {
        return res.status(502).json({
          error: 'AI returned an empty draft. Please write a reply manually.'
        });
      }

      res.json({
        draft: draft.trim()
      });
    } catch (error) {
      console.error('AI reply draft failed:', error.message);

      res.status(503).json({
        error: 'Unable to generate a reply right now. Please reply manually.'
      });
    }
  }
);


app.post('/api/tickets/:id/internal-notes', auth, adminOnly, async (req, res) => {
  try {
    const schema = z.object({
      body: z.string().min(1)
    });

    const { body } = schema.parse(req.body);

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    ticket.messages.push({
      senderRole: 'admin',
      senderId: req.user.id,
      body,
      internal: true
    });

    await ticket.save();

    res.status(201).json(ticket);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Internal note cannot be empty'
      });
    }

    console.error('Internal note error:', error);
    res.status(500).json({
      error: 'Failed to add internal note'
    });
  }
});

app.post('/api/tickets/:id/ai-draft', auth, adminOnly, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    const book = ticket.book_id
      ? await Book.findOne({ book_id: ticket.book_id })
      : null;

    const history = ticket.messages.map(message => ({
      senderRole: message.senderRole,
      body: message.body
    }));

    const draft = await draftReply(ticket, book, history);

    res.json({ draft });
  } catch (error) {
    console.error('AI draft error:', error);
    res.status(500).json({
      error: 'Failed to generate AI draft'
    });
  }
});

app.get('/api/admin/tickets', auth, adminOnly, async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    const tickets = await Ticket.find(filter)
      .sort({ updatedAt: -1 })
      .populate('assignedTo', 'name email');

    res.json(tickets);
  } catch (error) {
    console.error('Admin ticket queue error:', error);
    res.status(500).json({
      error: 'Failed to load admin ticket queue'
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'BookLeaf API is running' });
});


app.get('/api/tickets/:id/attachment', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    // Only the ticket's author or an admin may download it.
    if (
      req.user.role !== 'admin' &&
      (
        req.user.role !== 'author' ||
        ticket.author_id !== req.user.author_id
      )
    ) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    if (!ticket.attachment || !ticket.attachment.path) {
      return res.status(404).json({
        error: 'No attachment found'
      });
    }

    const filePath = path.resolve(ticket.attachment.path);

    // Ensure the file is inside the server's uploads directory.
    if (!filePath.startsWith(path.resolve(uploadDir) + path.sep)) {
      return res.status(400).json({
        error: 'Invalid attachment path'
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'Attachment file not found on server'
      });
    }

    res.download(filePath, ticket.attachment.originalName);
  } catch (error) {
    console.error('Attachment download error:', error);
    res.status(500).json({
      error: 'Failed to download attachment'
    });
  }
});

app.use((error, req, res, next) => {
  console.error('Server error:', error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    error: 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');

    app.listen(PORT, '127.0.0.1', () => {
  console.log(`BookLeaf API running on http://127.0.0.1:${PORT}`);
});
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  });