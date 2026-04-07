import axios from "axios";

import { BlacklistService } from "../src/services/blacklist.service";
import { ForbiddenError, ServiceUnavailableError } from "../src/utils/errors";

jest.mock("axios");

describe("BlacklistService", () => {
  it("rejects blacklisted users", async () => {
    jest.mocked(axios.get).mockResolvedValueOnce({
      data: {
        status: "success",
        data: [{ reason: "karma-hit" }],
      },
    });

    const service = new BlacklistService();

    await expect(service.ensureUserIsNotBlacklisted("12345678901")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("returns service unavailable when provider fails", async () => {
    jest.mocked(axios.get).mockRejectedValueOnce(new Error("network error"));

    const service = new BlacklistService();

    await expect(service.ensureUserIsNotBlacklisted("12345678901")).rejects.toBeInstanceOf(
      ServiceUnavailableError,
    );
  });
});
