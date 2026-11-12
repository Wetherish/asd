import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  agentId!: string;

  @IsOptional()
  @IsString()
  scheduledFor?: string;

  @IsOptional()
  recurring?: { rule: string };
}
