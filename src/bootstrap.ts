import { AuthController } from "./controllers/auth.controller";
import { WalletController } from "./controllers/wallet.controller";
import { AuthRepository } from "./repositories/auth.repository";
import { UserRepository } from "./repositories/user.repository";
import { WalletRepository } from "./repositories/wallet.repository";
import { AuthService } from "./services/auth.service";
import { BlacklistService } from "./services/blacklist.service";
import { UserService } from "./services/user.service";
import { WalletService } from "./services/wallet.service";

const userRepository = new UserRepository();
const walletRepository = new WalletRepository();
const authRepository = new AuthRepository();
const blacklistService = new BlacklistService();

const userService = new UserService(userRepository, walletRepository, blacklistService);
const authService = new AuthService(userRepository, authRepository);
const walletService = new WalletService(walletRepository);

export const authController = new AuthController(userService, authService);
export const walletController = new WalletController(walletService);
export const authMiddlewareDependencies = {
  authService,
};
