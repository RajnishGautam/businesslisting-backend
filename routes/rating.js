const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const { auth } = require('../middleware/auth');

// Add rating to a business
router.post('/:businessId', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const businessId = req.params.businessId;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Find business
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Check if user already rated this business
    const existingRatingIndex = business.ratings.findIndex(
      r => r.userId.toString() === req.user.id
    );

    if (existingRatingIndex !== -1) {
      // Update existing rating
      business.ratings[existingRatingIndex].rating = rating;
      business.ratings[existingRatingIndex].comment = comment || '';
      business.ratings[existingRatingIndex].createdAt = Date.now();
    } else {
      // Add new rating
      business.ratings.push({
        userId: req.user.id,
        userName: req.user.name || 'Anonymous',
        rating,
        comment: comment || ''
      });
    }

    // Recalculate average rating
    const totalRatings = business.ratings.length;
    const sumRatings = business.ratings.reduce((sum, r) => sum + r.rating, 0);
    business.averageRating = (sumRatings / totalRatings).toFixed(1);
    business.totalRatings = totalRatings;

    await business.save();

    res.json({ 
      message: existingRatingIndex !== -1 ? 'Rating updated successfully' : 'Rating added successfully',
      averageRating: business.averageRating,
      totalRatings: business.totalRatings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all ratings for a business (public)
router.get('/:businessId', async (req, res) => {
  try {
    const business = await Business.findById(req.params.businessId).select('ratings averageRating totalRatings');
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    res.json({
      ratings: business.ratings.sort((a, b) => b.createdAt - a.createdAt),
      averageRating: business.averageRating,
      totalRatings: business.totalRatings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete rating (user can delete their own rating)
router.delete('/:businessId', auth, async (req, res) => {
  try {
    const business = await Business.findById(req.params.businessId);
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const ratingIndex = business.ratings.findIndex(
      r => r.userId.toString() === req.user.id
    );

    if (ratingIndex === -1) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    business.ratings.splice(ratingIndex, 1);

    // Recalculate average rating
    if (business.ratings.length > 0) {
      const totalRatings = business.ratings.length;
      const sumRatings = business.ratings.reduce((sum, r) => sum + r.rating, 0);
      business.averageRating = (sumRatings / totalRatings).toFixed(1);
      business.totalRatings = totalRatings;
    } else {
      business.averageRating = 0;
      business.totalRatings = 0;
    }

    await business.save();

    res.json({ message: 'Rating deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;