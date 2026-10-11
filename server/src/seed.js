require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { User, Book } = require('./models');
const data = require('../data/bookleaf_sample_data.json');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const mkUser = (email, pw, role, name, author_id) =>
      User.updateOne(
        { email },
        {
          $setOnInsert: {
            passwordHash: bcrypt.hashSync(pw, 10),
            role,
            name,
            author_id
          }
        },
        { upsert: true }
      );

    await mkUser(
      'admin@bookleaf.com',
      'Admin@123',
      'admin',
      'BookLeaf Admin'
    );

    for (const author of data.authors) {
      await mkUser(
        author.email,
        'Author@123',
        'author',
        author.name,
        author.author_id
      );

      for (const book of author.books) {
        await Book.updateOne(
          { book_id: book.book_id },
          {
            ...book,
            author_id: author.author_id
          },
          { upsert: true }
        );
      }
    }

    console.log('Seeded successfully');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();