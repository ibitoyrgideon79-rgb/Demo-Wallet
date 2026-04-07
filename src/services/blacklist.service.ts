import axios from "axios";

import { env } from "../config/env";
import { ForbiddenError } from "../utils/errors";

interface AdjutorResponse {
  status?: string;
  data?: unknown;
}

export class BlacklistService {
  private hasMatch(data: unknown): boolean {
    if (Array.isArray(data)) {
      return data.length > 0;
    }

    if (data && typeof data === "object") {
      return Object.keys(data).length > 0;
    }

    return Boolean(data);
  }

  async ensureUserIsNotBlacklisted(identity: string): Promise<void> {
    if (!env.adjutorApiKey) {
      throw new ForbiddenError("Adjutor API key is missing; onboarding is blocked");
    }

    try {
      const response = await axios.get<AdjutorResponse>(
        `${env.adjutorBaseUrl}/v2/verification/karma/${encodeURIComponent(identity)}`,
        {
          headers: {
            Authorization: `Bearer ${env.adjutorApiKey}`,
            Accept: "application/json",
          },
          timeout: env.adjutorTimeoutMs,
        },
      );

      if (response.data?.status === "success" && this.hasMatch(response.data.data)) {
        throw new ForbiddenError("User is blacklisted and cannot be onboarded");
      }
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw error;
      }

      throw new ForbiddenError("Unable to verify blacklist status; onboarding is blocked");
    }
  }
}
