const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('Auth routes', () => {
  test('Register and login', async () => {
    // Register
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', email: 'test@example.com', password: 'password' });

    expect(registerRes.statusCode).toBe(201);

    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
    expect(loginRes.body.user.email).toBe('test@example.com');

    // Ensure user in DB
    const dbUser = await User.findOne({ email: 'test@example.com' });
    expect(dbUser).not.toBeNull();
  });
});
