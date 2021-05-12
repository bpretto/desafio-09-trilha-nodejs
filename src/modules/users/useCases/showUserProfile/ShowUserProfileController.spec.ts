import request from "supertest";
import { Connection } from "typeorm";
import { app } from "../../../../app";
import { hash } from "bcryptjs"

import createDbConnection from '../../../../database';
import { UsersRepository } from "../../repositories/UsersRepository";

let connection: Connection;
let usersRepository: UsersRepository;

describe("Show User Profile Controller", () => {

    beforeAll(async () => {
        connection = await createDbConnection();
        await connection.runMigrations();
        usersRepository = new UsersRepository();
    });

    afterAll(async () => {
        await connection.dropDatabase();
        await connection.close();
    })

    it("Should be able to show user profile", async () => {
        const email = "supertest@email.com";
        const password = "supertestpassword";

        const user = await usersRepository.create({
            name: "Supertest Name",
            email: "supertest@email.com",
            password: await hash(password, 8),
        });

        const id = user.id;

        const authenticate = await request(app)
            .post("/api/v1/sessions")
            .send({
                email,
                password,
            });

        const { token } = authenticate.body;

        const response = await request(app)
            .get("/api/v1/profile")
            .send(id)
            .set({
                Authorization: `Bearer ${token}`,
            });

        expect(response.body).toHaveProperty("name");
        expect(response.body).toHaveProperty("created_at");
        expect(response.body).toHaveProperty("updated_at");
    });

    it("Should not be able to show user profile without authenticating", async () => {
        const user = await usersRepository.create({
            name: "Supertest Name2",
            email: "supertest@email2.com",
            password: await hash("supertestpassword2", 8),
        });

        const id = user.id;

        const response = await request(app)
            .get("/api/v1/profile")
            .send(id);

        expect(response.status).toBe(401);
    });
});