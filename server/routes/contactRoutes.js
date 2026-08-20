const express = require('express');
const { body } = require('express-validator');
const { createContact, getContacts, updateContact, deleteContact } = require('../controllers/contactController');
const { protect } = require('../middleware/auth');
const { publicFormLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post(
  '/',
  publicFormLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
    body('email').trim().isEmail().withMessage('A valid email is required'),
    body('phone').optional({ checkFalsy: true }).isLength({ max: 20 }),
    body('subject').optional({ checkFalsy: true }).isLength({ max: 200 }),
    body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 5000 }),
  ],
  createContact
);

router.get('/', protect, getContacts);
router.patch('/:id', protect, updateContact);
router.delete('/:id', protect, deleteContact);

module.exports = router;
