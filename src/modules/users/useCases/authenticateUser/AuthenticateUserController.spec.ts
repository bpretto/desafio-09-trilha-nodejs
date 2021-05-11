import request from "supertest";
import { Connection } from "typeorm";
import { app } from "../../../../app";

import createDbConnection from '../../../../database';

let connection: Connection;



describe("Authenticate User Controller", () => {

    beforeAll(async () => {
        connection = await createDbConnection();
        await connection.runMigrations();
        await request(app)
            .post("/api/v1/users")
            .send({
                name: "Supertest Name",
                email: "supertest@email.com",
                password: "supertestpassword",
            });
    });

    afterAll(async () => {
        await connection.dropDatabase();
        await connection.close();
    })

    it("Should be able to authenticate an user", async () => {
        const response = await request(app)
            .post("/api/v1/sessions")
            .send({
                email: "supertest@email.com",
                password: "supertestpassword",
            });

        expect(response.body).toHaveProperty("token");
    });

    // it("Should not be able to create a new user with same e-mail", async () => {
    //     const response = await request(app)
    //         .post("/api/v1/users")
    //         .send({
    //             name: "Supertest Name2",
    //             email: "supertest@email.com",
    //             password: "supertestpassword2",
    //         });

    //     expect(response.status).toBe(400);
    // });
});