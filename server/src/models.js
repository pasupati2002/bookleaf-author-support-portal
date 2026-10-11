const mongoose = require('mongoose');
const { Schema } = mongoose;

const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

const User = mongoose.model(
  'User',
  new Schema({
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['author', 'admin'],
      required: true
    },
    name: String,
    author_id: String
  })
);

const Book = mongoose.model(
  'Book',
  new Schema({
    book_id: {
      type: String,
      unique: true
    },
    author_id: {
      type: String,
      index: true
    },
    title: String,
    isbn: String,
    genre: String,
    publication_date: String,
    status: String,
    mrp: Number,
    author_royalty_per_copy: Number,
    total_copies_sold: Number,
    total_royalty_earned: Number,
    royalty_paid: Number,
    royalty_pending: Number,
    last_royalty_payout_date: String,
    print_partner: String,
    available_on: [String]
  })
);

const Ticket = mongoose.model(
  'Ticket',
  new Schema(
    {
      author_id: {
        type: String,
        index: true
      },
      book_id: String,
      subject: String,
      description: String,
      attachment: {
  originalName: String,
  filename: String,
  mimetype: String,
  size: Number,
  path: String
},
      status: {
        type: String,
        enum: STATUSES,
        default: 'Open'
      },
      category: String,
      priority: String,
      aiClassified: {
        type: Boolean,
        default: false
      },
      assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      messages: [
        {
          senderRole: String,
          senderId: Schema.Types.ObjectId,
          body: String,
          internal: {
            type: Boolean,
            default: false
          },
          createdAt: {
            type: Date,
            default: Date.now
          }
        }
      ]
    },
    {
      timestamps: true
    }
  )
);

module.exports = {
  User,
  Book,
  Ticket,
  STATUSES
};