import { Router } from "express";

import { authMiddlewareDependencies, walletController } from "../bootstrap";
import { authMiddleware } from "../middleware/auth.middleware";

const walletRouter = Router();

walletRouter.use(authMiddleware(authMiddlewareDependencies.authService));

walletRouter.get("/me", async (request, response) => walletController.getWallet(request, response));
walletRouter.get("/transactions", async (request, response) => walletController.getTransactions(request, response));
walletRouter.post("/fund", async (request, response) => walletController.fundWallet(request, response));
walletRouter.post("/transfer", async (request, response) => walletController.transferFunds(request, response));
walletRouter.post("/withdraw", async (request, response) => walletController.withdrawFunds(request, response));

export default walletRouter;
