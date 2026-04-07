import { Router } from "express";

import { WalletController } from "../controllers/wallet.controller";

const walletRouter = Router();
const walletController = new WalletController();

walletRouter.get("/me", (request, response) => walletController.getWallet(request, response));
walletRouter.post("/fund", (request, response) => walletController.fundWallet(request, response));
walletRouter.post("/transfer", (request, response) => walletController.transferFunds(request, response));
walletRouter.post("/withdraw", (request, response) => walletController.withdrawFunds(request, response));

export default walletRouter;
