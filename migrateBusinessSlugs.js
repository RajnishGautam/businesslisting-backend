// migrateBusinessSlugs.js
// Run this file once to add slugs to existing businesses
// Place this file in your backend root directory

const mongoose = require('mongoose');
const Business = require('./models/Business');

// MongoDB connection string
const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://rajnish7dot_db_user:smGLIW27wh4ts5k3@businesslisting.nctuftv.mongodb.net/';

// Helper function to create slug
const createSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Main migration function
const migrateBusinessSlugs = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const businesses = await Business.find();
    console.log(`Found ${businesses.length} businesses to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (const business of businesses) {
      try {
        const slug = `${createSlug(business.city)}/${createSlug(
          business.category
        )}/${createSlug(business.businessName)}`;

        business.slug = slug;
        await business.save();

        successCount++;
        console.log(`Updated ${business.businessName} -> ${slug}`);
      } catch (err) {
        errorCount++;
        console.error(`Error updating ${business.businessName}`, err.message);
      }
    }

    console.log('Migration completed');
    console.log(`Success ${successCount}`);
    console.log(`Errors ${errorCount}`);

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed', err);
    process.exit(1);
  }
};

// Run migration
migrateBusinessSlugs();
