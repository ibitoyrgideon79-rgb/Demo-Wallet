import { Router } from "express";

import authRouter from "./auth.routes";
import walletRouter from "./wallet.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/wallets", walletRouter);

export default router;
