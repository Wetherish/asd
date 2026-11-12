import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AdminConfirmSignUpCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

// Server-side Cognito calls. SignUp and InitiateAuth (USER_PASSWORD_AUTH) are
// unauthenticated Cognito APIs — no IAM required. The backend only needs to
// confirm the password is correct; the local JWT remains the session token.
@Injectable()
export class CognitoService {
  private readonly client: CognitoIdentityProviderClient;
  private readonly clientId: string;
  private readonly userPoolId: string;

  constructor(private readonly config: ConfigService) {
    this.clientId = this.config.get<string>("COGNITO_CLIENT_ID") ?? "";
    this.userPoolId = this.config.get<string>("COGNITO_USER_POOL_ID") ?? "";
    this.client = new CognitoIdentityProviderClient({
      region: this.config.get<string>("AWS_REGION") ?? "eu-north-1",
    });
  }

  async signUp(email: string, password: string): Promise<void> {
    const res = await this.client.send(
      new SignUpCommand({
        ClientId: this.clientId,
        Username: email,
        Password: password,
        UserAttributes: [{ Name: "email", Value: email }],
      }),
    );
    // Auto-confirm + verify so sign-up is immediate (no code flow). Admin APIs
    // need the internal username (UserSub), not the email alias.
    const username = res.UserSub ?? email;
    await this.client.send(new AdminConfirmSignUpCommand({ UserPoolId: this.userPoolId, Username: username }));
    await this.client.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        UserAttributes: [{ Name: "email_verified", Value: "true" }],
      }),
    );
  }

  async verifyPassword(email: string, password: string): Promise<void> {
    await this.client.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: this.clientId,
        AuthParameters: { USERNAME: email, PASSWORD: password },
      }),
    );
  }
}
