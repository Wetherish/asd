import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DecryptCommand, EncryptCommand, KMSClient } from "@aws-sdk/client-kms";

// Encrypts/decrypts per-user LLM API keys with AWS KMS. When KMS_KEY_ID is not
// configured (local dev) it is a pass-through so local development still works.
@Injectable()
export class KmsService {
  private readonly client: KMSClient | null;
  private readonly keyId: string;

  constructor(config: ConfigService) {
    this.keyId = config.get<string>("KMS_KEY_ID") ?? "";
    this.client = this.keyId
      ? new KMSClient({ region: config.get<string>("AWS_REGION") ?? "eu-north-1" })
      : null;
  }

  async encrypt(plaintext: string): Promise<string> {
    if (!this.client) return plaintext;
    const res = await this.client.send(
      new EncryptCommand({ KeyId: this.keyId, Plaintext: Buffer.from(plaintext, "utf8") }),
    );
    const blob = res.CiphertextBlob;
    if (!blob) throw new Error("KMS Encrypt returned no ciphertext");
    return Buffer.from(blob).toString("base64");
  }

  async decrypt(ciphertext: string): Promise<string> {
    if (!this.client) return ciphertext;
    const res = await this.client.send(
      new DecryptCommand({ CiphertextBlob: Buffer.from(ciphertext, "base64") }),
    );
    const plain = res.Plaintext;
    if (!plain) throw new Error("KMS Decrypt returned no plaintext");
    return Buffer.from(plain).toString("utf8");
  }
}
