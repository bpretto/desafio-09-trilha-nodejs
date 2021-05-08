import request from "supertest";
import { app } from "../../../../app";
// import { router } from "../../../../routes";

describe("Create Category Controller", () => {
    it("Should be able to create a new user", async () => {
        const response = await request(app)
            .post("/api/v1/users")
            .send({
                name: "Supertest Name",
                email: "supertest@email.com",
                password: "supertestpassword",
            });

        console.log(response.error)

        expect(response.status).toBe(201);
    })
});