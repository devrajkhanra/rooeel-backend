import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Auth Separation (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        prisma = app.get<PrismaService>(PrismaService);

        // Cleanup
        await prisma.adminSession.deleteMany();
        await prisma.userSession.deleteMany();
        await prisma.admin.deleteMany();
        await prisma.user.deleteMany();
    });

    afterAll(async () => {
        await prisma.adminSession.deleteMany();
        await prisma.userSession.deleteMany();
        await prisma.admin.deleteMany();
        await prisma.user.deleteMany();
        await app.close();
    });

    const adminDto = {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        password: 'password123',
    };

    const userDto = { // Assuming user signup exists or we create manually
        firstName: 'Normal',
        lastName: 'User',
        email: 'user@test.com',
        password: 'password123',
    };

    let adminToken: string;
    let userToken: string;

    it('/admin/signup (POST)', async () => {
        const response = await request(app.getHttpServer())
            .post('/admin/signup')
            .send(adminDto)
            .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.email).toBe(adminDto.email);
    });

    it('/admin/login (POST)', async () => {
        const response = await request(app.getHttpServer())
            .post('/admin/login')
            .send({ email: adminDto.email, password: adminDto.password })
            .expect(201);

        expect(response.body).toHaveProperty('token');
        adminToken = response.body.token;
    });

    // Since user signup is not explicitly in the controller shown (only login), 
    // I'll check if I need to create a user manually in DB or if there is a signup endpoint.
    // The user controller only showed login and logout.
    // I'll create the user directly in DB for the test.
    it('Create User manually', async () => {
        // Need to hash password manually as in service
        const crypto = require('crypto');
        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = crypto.scryptSync(userDto.password, salt, 64).toString('hex');

        await prisma.user.create({
            data: {
                firstName: userDto.firstName,
                lastName: userDto.lastName,
                email: userDto.email,
                salt,
                passwordHash
            }
        });
    });

    it('/user/login (POST)', async () => {
        const response = await request(app.getHttpServer())
            .post('/user/login')
            .send({ email: userDto.email, password: userDto.password })
            .expect(201);

        expect(response.body).toHaveProperty('token');
        userToken = response.body.token;
    });

    it('/admin/logout (POST) with Admin Token', () => {
        return request(app.getHttpServer())
            .post('/admin/logout')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(201);
    });

    // Re-login admin to get fresh token
    it('/admin/login (POST) again', async () => {
        const response = await request(app.getHttpServer())
            .post('/admin/login')
            .send({ email: adminDto.email, password: adminDto.password })
            .expect(201);
        adminToken = response.body.token;
    });

    it('/user/logout (POST) with User Token', () => {
        return request(app.getHttpServer())
            .post('/user/logout')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(201);
    });

    // Cross-access tests
    // Admin trying to access User protected route (logout)
    it('/user/logout (POST) with Admin Token -> Should Fail', () => {
        // User logout expects a token that exists in UserSession.
        // Admin token exists in AdminSession.
        // So UserAuthGuard should fail to find it in UserSession.
        return request(app.getHttpServer())
            .post('/user/logout')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(401);
    });

    // User trying to access Admin protected route (logout)
    // Re-login user
    it('/user/login (POST) again', async () => {
        const response = await request(app.getHttpServer())
            .post('/user/login')
            .send({ email: userDto.email, password: userDto.password })
            .expect(201);
        userToken = response.body.token;
    });

    it('/admin/logout (POST) with User Token -> Should Fail', () => {
        return request(app.getHttpServer())
            .post('/admin/logout')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(401);
    });
});
