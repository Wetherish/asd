import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class CreateShareLinkDto {
  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

export class UnlockShareLinkDto {
  @IsString()
  password!: string;
}
