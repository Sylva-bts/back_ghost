const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const axios = require('axios');

jest.mock('axios');

describe('Deposit route', () => {
  test('Create deposit and receive payUrl', async () => {
    // create user
    const user = new User({ username: 'payer', email: 'payer@example.com', password: 'secret' });
    await user.save();

    // generate token via login route
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'payer@example.com', password: 'secret' });

    // If password is not hashed (since we created without bcrypt), login will fail.
    // Instead, directly create a token using jwt to simplify test.
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Mock OxaPay response
    axios.post.mockResolvedValue({ data: { trackId: 'track123', payLink: 'https://pay.example.com/123' } });

    const res = await request(app)
      .post('/api/deposit')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 10 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('payUrl');
    expect(res.body.payUrl).toBe('https://pay.example.com/123');

    // Ensure transaction saved and has oxapayTrackId
    const tx = await Transaction.findOne({ userId: user._id });
    expect(tx).not.toBeNull();
    expect(tx.oxapayTrackId).toBe('track123');
  });

  test('Reject invalid amount', async () => {
    const user = new User({ username: 'u2', email: 'u2@example.com', password: 'p' });
    await user.save();
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const res = await request(app)
      .post('/api/deposit')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 1 });

    expect(res.statusCode).toBe(400);
  });
});
