import { Body, Controller, Get, Post } from "@nestjs/common";
import { IsEmail, IsString, MinLength } from "class-validator";
import { AuthService } from "./auth.service";
import { AuthUser, CurrentUser } from "../common/current-user.decorator";
import { Public } from "../common/public.decorator";
import { Person } from "../shared/contract";

class CredentialsDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("signup")
  signup(@Body() dto: CredentialsDto): Promise<{ token: string; user: Person }> {
    return this.auth.signup(dto.email, dto.password);
  }

  @Public()
  @Post("login")
  login(@Body() dto: CredentialsDto): Promise<{ token: string; user: Person }> {
    return this.auth.login(dto.email, dto.password);
  }
}

@Controller()
export class UsersController {
  constructor(private readonly auth: AuthService) {}

  @Get("me")
  me(@CurrentUser() user: AuthUser): Promise<Person> {
    return this.auth.me(user.sub);
  }
}
