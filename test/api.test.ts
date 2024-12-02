import { it, describe, beforeEach, afterEach, expect } from 'vitest';
import { createTestServer, TestServer } from './helpers.js';

describe('api', () => {
  let server: TestServer;

  beforeEach(async () => {
    server = await createTestServer();
  });

  afterEach(async () => {
    await server.close();
  });

  it('returns a well formed api', async () => {
    await server.ready();

    expect(server.swagger()).toMatchSnapshot();
  });
});
