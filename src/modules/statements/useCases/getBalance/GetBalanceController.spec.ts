import { hash } from "bcryptjs";
import request from "supertest";
import { Connection } from "typeorm";
import { app } from "../../../../app";

import createDbConnection from '../../../../database';
import { UsersRepository } from "../../../users/repositories/UsersRepository";

let connection: Connection;
let usersRepository: UsersRepository;

describe("Get Balance Controller", () => {

    beforeAll(async () => {
        connection = await createDbConnection();
        await connection.runMigrations();
        usersRepository = new UsersRepository();
    });

    afterAll(async () => {
        await connection.dropDatabase();
        await connection.close();
    })

    it("Should be able to get user's balance", async () => {
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

        await request(app)
            .post("/api/v1/statements/deposit")
            .send(statementOperation)
            .set({
                Authorization: `Bearer ${token}`,
            });

        const response = await request(app)
            .get("/api/v1/statements/balance")
            .send(user_id)
            .set({
                Authorization: `Bearer ${token}`,
            });

        expect(response.status).toBe(200);
        expect(response.body.balance).toBe(100);
    });

    it("Should not be able to get unauthenticated user's balance", async () => {
        const email = "supertest@email2.com";
        const password = "supertestpassword2";

        const user = await usersRepository.create({
            name: "Supertest Name 2",
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

        await request(app)
            .post("/api/v1/statements/deposit")
            .send(statementOperation)
            .set({
                Authorization: `Bearer ${"token"}`,
            });

        const response = await request(app)
            .get("/api/v1/statements/balance")
            .send(user_id)
            .set({
                Authorization: `Bearer ${"token"}`,
            });

        expect(response.status).toBe(401);
        expect(response.text).toEqual("{\"message\":\"JWT invalid token!\"}");
    });
});