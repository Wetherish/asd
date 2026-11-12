import { IsIn, IsOptional } from 'class-validator';

export class DecideApprovalDto {
  @IsIn(['approve', 'reject', 'edit'])
  action!: string;

  @IsOptional()
  edits?: unknown;
}
