import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateArtifactDto {
  @IsIn(['table', 'doc', 'canvas', 'dashboard'])
  kind!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  content?: unknown;
}

export class UpdateArtifactDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  content?: unknown;
}

export class ShareArtifactDto {
  @IsArray()
  @IsString({ each: true })
  personIds!: string[];

  @IsOptional()
  @IsIn(['owner', 'editor', 'viewer'])
  role?: string;
}
