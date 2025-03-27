import request from 'supertest';
import app from '../../src/index';
import { Server } from 'http';

let server: Server;

beforeAll(() => {
  server = app.listen(4000);
});

afterAll((done) => {
  server.close(done);
});

describe('Health Check Endpoint', () => {
  it('should return a 200 status and a success message', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('message', 'Server is healthy');
    expect(response.body).toHaveProperty('timestamp');
  });
});
