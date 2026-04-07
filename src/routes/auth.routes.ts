import { Router } from "express";

import { AuthController } from "../controllers/auth.controller";

const authRouter = Router();
const authController = new AuthController();

authRouter.post("/register", (request, response) => authController.register(request, response));
authRouter.post("/login", (request, response) => authController.login(request, response));

export default authRouter;
