const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const { auth, adminAuth } = require('../middleware/auth');

// Create business listing (USER)
router.post('/', auth, async (req, res) => {
  try {
    const { businessName, category, description, email, phone, address, city, image } = req.body;

    // Validation
    if (!businessName || !category || !description || !email || !phone || !address || !city || !image) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    // Check if user already has a business listing
    const existingBusiness = await Business.findOne({ userId: req.user.id, isAdminListing: false });
    if (existingBusiness) {
      return res.status(400).json({ message: 'You already have a business listing. Please edit your existing listing.' });
    }

    // Create new business
    const business = new Business({
      userId: req.user.id,
      businessName,
      category,
      description,
      email,
      phone,
      address,
      city,
      image,
      isAdminListing: false
    });

    await business.save();

    res.status(201).json({ message: 'Business listing created successfully', business });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create business listing (ADMIN)
router.post('/admin', adminAuth, async (req, res) => {
  try {
    const { businessName, category, description, email, phone, address, city, image } = req.body;

    // Validation
    if (!businessName || !category || !description || !email || !phone || !address || !city || !image) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    // Create new business by admin
    const business = new Business({
      userId: req.user.id,
      businessName,
      category,
      description,
      email,
      phone,
      address,
      city,
      image,
      isAdminListing: true
    });

    await business.save();

    res.status(201).json({ message: 'Business listing created successfully by admin', business });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all business listings (public)
router.get('/', async (req, res) => {
  try {
    const { search, category, city } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    const businesses = await Business.find(query).sort({ createdAt: -1 });
    res.json(businesses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all admin listings (ADMIN ONLY)
router.get('/admin/listings', adminAuth, async (req, res) => {
  try {
    const businesses = await Business.find({ isAdminListing: true }).sort({ createdAt: -1 });
    res.json(businesses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all user listings (ADMIN ONLY)
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const businesses = await Business.find().populate('userId', 'name email').sort({ createdAt: -1 });
    res.json(businesses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's business listing
router.get('/my-business', auth, async (req, res) => {
  try {
    const business = await Business.findOne({ userId: req.user.id, isAdminListing: false });
    res.json(business);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update business listing (USER)
router.put('/:id', auth, async (req, res) => {
  try {
    const { businessName, category, description, email, phone, address, city, image } = req.body;

    // Find business
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Check if user owns this business
    if (business.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update business
    business.businessName = businessName || business.businessName;
    business.category = category || business.category;
    business.description = description || business.description;
    business.email = email || business.email;
    business.phone = phone || business.phone;
    business.address = address || business.address;
    business.city = city || business.city;
    business.image = image || business.image;
    business.updatedAt = Date.now();

    await business.save();

    res.json({ message: 'Business updated successfully', business });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update business listing (ADMIN)
router.put('/admin/:id', adminAuth, async (req, res) => {
  try {
    const { businessName, category, description, email, phone, address, city, image } = req.body;

    // Find business
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Update business
    business.businessName = businessName || business.businessName;
    business.category = category || business.category;
    business.description = description || business.description;
    business.email = email || business.email;
    business.phone = phone || business.phone;
    business.address = address || business.address;
    business.city = city || business.city;
    business.image = image || business.image;
    business.updatedAt = Date.now();

    await business.save();

    res.json({ message: 'Business updated successfully by admin', business });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete business listing (USER)
router.delete('/:id', auth, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Check if user owns this business
    if (business.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Business.findByIdAndDelete(req.params.id);

    res.json({ message: 'Business deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete business listing (ADMIN)
router.delete('/admin/:id', adminAuth, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    await Business.findByIdAndDelete(req.params.id);

    res.json({ message: 'Business deleted successfully by admin' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Get all admin listings (PUBLIC)
router.get('/admin/public-listings', async (req, res) => {
  try {
    const businesses = await Business.find({ isAdminListing: true }).sort({ createdAt: -1 });
    res.json(businesses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;