import db from "@/prisma/client";
import axios from "axios";
import cron from "node-cron";
import { STATUS } from "@/typescript";
import { HttpException } from "@/utils/HttpException.utils";
import https from "https";

class AccessSecretService {
  private static readonly API_URL =
    "https://192.168.164.7/website_demo/middleware/?action=Secretkey&class=general";

  private static readonly API_BODY = {
    Username: "WebServiceUser",
    Pwd: "A01834h123ds2",
  };

  private static async fetchSecretFromAPI(): Promise<string> {
    try {
      const response = await axios.post(this.API_URL, this.API_BODY, {
        headers: { "Content-Type": "application/json" },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      });

      if (response.data?.secret) return response.data.secret;
      if (response.data?.key) return response.data.key;

      throw new HttpException(
        STATUS.BAD_REQUEST,
        "Secret key not found in API response"
      );
    } catch (error: any) {
      throw new HttpException(
        STATUS.BAD_REQUEST,
        `Failed to fetch secret from API: ${error.message}`
      );
    }
  }

  public static async updateAccessSecret() {
    const secretValue = await this.fetchSecretFromAPI();

    const existing = await db.access_secret.findFirst();

    if (existing) {
      return await db.access_secret.update({
        where: { Id: existing.Id },
        data: { value: secretValue },
      });
    } else {
      return await db.access_secret.create({
        data: { value: secretValue },
      });
    }
  }

  public static startCronJob() {
    cron.schedule("0 0 * * *", async () => {
      try {
        const result = await this.updateAccessSecret();
      } catch (error) {
      }
    });
  }

  public static async testUpdateAccessSecret() {
    try {
      const result = await this.updateAccessSecret();
      return result;
    } catch (error) {
      throw error;
    }
  }
}

export default AccessSecretService;