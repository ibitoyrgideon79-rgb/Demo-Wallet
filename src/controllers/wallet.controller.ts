import type { Request, Response } from "express";

export class WalletController {
  getWallet(_request: Request, response: Response): void {
    response.status(501).json({
      message: "Get wallet endpoint not implemented yet",
    });
  }

  fundWallet(request: Request, response: Response): void {
    response.status(501).json({
      message: "Fund wallet endpoint not implemented yet",
      body: request.body,
    });
  }

  transferFunds(request: Request, response: Response): void {
    response.status(501).json({
      message: "Transfer funds endpoint not implemented yet",
      body: request.body,
    });
  }

  withdrawFunds(request: Request, response: Response): void {
    response.status(501).json({
      message: "Withdraw funds endpoint not implemented yet",
      body: request.body,
    });
  }
}
