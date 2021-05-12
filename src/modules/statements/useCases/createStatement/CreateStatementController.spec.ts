import { hash } from "bcryptjs";
import request from "supertest";
import { Connection } from "typeorm";
import { app } from "../../../../app";

import createDbConnection from '../../../../database';
import { UsersRepository } from "../../../users/repositories/UsersRepository";

let connection: Connection;
let usersRepository: UsersRepository;

describe("Create Statement Controller", () => {

    beforeAll(async () => {
        connection = await createDbConnection();
        await connection.runMigrations();
        usersRepository = new UsersRepository();
    });

    afterAll(async () => {
        await connection.dropDatabase();
        await connection.close();
    })

    it("Should be able to create deposit statement", async () => {
        const email = "supertest@email.com";
        const password = "supertestpassword";

        const user = await usersRepository.create({
            name: "Supertest Name",
            email,
            password: await hash(password, 8),
        });

        const user_id = user.id;

        const authenticate = await request(app)
            .post("/api/v1/sessions")
            .send({
                email,
                password,
            });

        const { token } = authenticate.body;

        const statementOperation = {
            user_id,
            type: 'deposit' as any,
            amount: 100,
            description: "sample description"
        };

        const response = await request(app)
            .post("/api/v1/statements/deposit")
            .send(statementOperation)
            .set({
                Authorization: `Bearer ${token}`,
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("id");
    });

    it("Should be able to create withdraw statement", async () => {
        const email = "supertest@email2.com";
        const password = "supertestpassword2";

        const user = await usersRepository.create({
            name: "Supertest Name 2",
            email,
            password: await hash(password, 8),
        });

        const user_id = user.id;

        const authenticate = await request(app)
            .post("/api/v1/sessions")
            .send({
                email,
                password,
            });

        const { token } = authenticate.body;

        const depositOperation = {
            user_id,
            type: 'deposit' as any,
            amount: 100,
            description: "sample description"
        };

        await request(app)
            .post("/api/v1/statements/deposit")
            .send(depositOperation)
            .set({
                Authorization: `Bearer ${token}`,
            });

        const withdrawOperation = {
            user_id,
            type: 'withdraw' as any,
            amount: 50,
            description: "sample description"
        };

        const response = await request(app)
            .post("/api/v1/statements/withdraw")
            .send(withdrawOperation)
            .set({
                Authorization: `Bearer ${token}`,
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("id");
        expect(response.body.amount).toBe(50);
    });

    it("Should not be able to create a statement without authenticated user", async () => {
        const email = "supertest@email3.com";
        const password = "supertestpassword3";

        const user = await usersRepository.create({
            name: "Supertest Name 3",
            email,
            password: await hash(password, 8),
        });

        const user_id = user.id;

        const statementOperation = {
            user_id,
            type: 'deposit' as any,
            amount: 100,
            description: "sample description"
        };

        const response = await request(app)
            .post("/api/v1/statements/deposit")
            .send(statementOperation)
            .set({
                Authorization: `Bearer ${"token"}`,
            });

        expect(response.status).toBe(401);
        expect(response.text).toEqual("{\"message\":\"JWT invalid token!\"}");
    });
});