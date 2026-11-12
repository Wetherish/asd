import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  leadAgentId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];
}

export class UpdateSessionDto {
  @IsOptional()
  @IsString()
  title?: string;
}
