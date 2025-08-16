import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createApp } from './biz.helpers';

describe('Businesses e2e', () => {
  let app: INestApplication;
  let server: any;
  let BID: string;

  beforeAll(async () => {
    app = await createApp();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Create → Approve → Activate', async () => {
    const orgId = 1;

    const resCreate = await request(server)
      .post('/businesses')
      .send({ organizationId: orgId, name: 'My Bistro', slug: 'my.bistro' })
      .expect(201);

    BID = resCreate.body.business?.id ?? resCreate.body.id;
    expect(BID).toBeDefined();

    await request(server)
      .post(`/businesses/${BID}/approve`)
      .expect(201);

    const resPatch = await request(server)
      .patch(`/businesses/${BID}`)
      .send({ isActive: true })
      .expect(200);

    const isActive =
      resPatch.body.business?.isActive ?? resPatch.body.isActive;
    expect(isActive).toBe(true);
  });

  it('Slug uniqueness → 409', async () => {
    const orgId = 1;
    await request(server)
      .post('/businesses')
      .send({ organizationId: orgId, name: 'Clone', slug: 'my.bistro' })
      .expect(409);
  });

  it('Soft delete → hidden → restore', async () => {
    await request(server).delete(`/businesses/${BID}`).expect(200);

    const resHidden = await request(server)
      .get('/businesses?search=my.bistro')
      .expect(200);

    const total =
      resHidden.body?.meta?.total ??
      resHidden.body?.total ??
      0;
    expect(total).toBe(0);

    await request(server)
      .post(`/businesses/${BID}/restore`)
      .expect(201);
  });
});
