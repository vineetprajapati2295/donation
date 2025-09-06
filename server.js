// server.js
// Minimal Express + Razorpay integration for donation tracking

const express = require('express');
const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const razorpay = new Razorpay({
  key_id: 'rzp_test_REKnFzx9N8gYD1', // Replace with your Key ID
  key_secret: '6kKweUawg3MkeFuN0VC1Hm2M', // Replace with your Key Secret
});

const GOAL = 130000;
let totalCollected = 0; // In rupees (demo: resets if server restarts)

// Endpoint: Get donation progress
app.get('/progress', (req, res) => {
  res.json({
    totalCollected,
    goal: GOAL
  });
});

// Endpoint: Create Razorpay order
app.post('/create-order', async (req, res) => {
  const { amount } = req.body;
  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // Amount in paisa
      currency: 'INR',
      receipt: `receipt_${Math.floor(Math.random() * 10000)}`,
      payment_capture: 1
    });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Verify payment and update amount
app.post('/verify-payment', (req, res) => {
  const { payment_id, order_id, signature, amount } = req.body;
  try {
    // Verify signature
    const crypto = require('crypto');
    const expectedSignature = crypto.createHmac('sha256', razorpay.key_secret)
      .update(order_id + "|" + payment_id)
      .digest('hex');
    if (expectedSignature === signature) {
      totalCollected += amount; // amount in rupees
      return res.json({ success: true });
    } else {
      return res.status(400).json({ success: false, error: "Invalid signature" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

