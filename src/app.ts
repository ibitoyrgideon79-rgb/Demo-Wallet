import express from "express";

import errorRoutes from "./routes";
import { errorMiddleware } from "./middleware/error.middleware";

const app = express();

app.use(express.json());

app.get("/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
  });
});

app.use("/api/v1", errorRoutes);
app.use(errorMiddleware);

export default app;
