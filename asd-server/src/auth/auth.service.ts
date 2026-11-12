import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { Person } from "../shared/contract";
import { toPerson } from "../shared/mappers";
import { CognitoService } from "./cognito.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly cognito: CognitoService,
  ) {}

  async signup(email: string, password: string): Promise<{ token: string; user: Person }> {
    const normalized = email.trim().toLowerCase();
    try {
      await this.cognito.signUp(normalized, password);
    } catch (err) {
      const name = (err as { name?: string })?.name;
      if (name === "UsernameExistsException") {
        throw new ConflictException("An account with this email already exists");
      }
      if (name === "InvalidPasswordException") {
        throw new BadRequestException("Password does not meet requirements (8+ chars, upper, lower, number)");
      }
      throw err;
    }
    return this.issueSession(normalized);
  }

  async login(email: string, password: string): Promise<{ token: string; user: Person }> {
    const normalized = email.trim().toLowerCase();
    try {
      await this.cognito.verifyPassword(normalized, password);
    } catch {
      throw new UnauthorizedException("Invalid email or password");
    }
    return this.issueSession(normalized);
  }

  async me(userId: string): Promise<Person> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return toPerson(user, "owner");
  }

  private async issueSession(email: string): Promise<{ token: string; user: Person }> {
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      const name = email.split("@")[0] || "User";
      user = await this.prisma.user.create({
        data: { email, name: name.charAt(0).toUpperCase() + name.slice(1) },
      });
    }
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email });
    return { token, user: toPerson(user, "owner") };
  }
}
