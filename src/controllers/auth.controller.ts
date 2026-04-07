import type { Request, Response } from "express";

export class AuthController {
  register(request: Request, response: Response): void {
    response.status(501).json({
      message: "Register endpoint not implemented yet",
      body: request.body,
    });
  }

  login(request: Request, response: Response): void {
    response.status(501).json({
      message: "Login endpoint not implemented yet",
      body: request.body,
    });
  }
}
