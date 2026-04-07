import { Router } from "express";

import { authController } from "../bootstrap";

const authRouter = Router();

authRouter.post("/register", async (request, response) => authController.register(request, response));
authRouter.post("/login", async (request, response) => authController.login(request, response));

export default authRouter;
