import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { Approval } from '../shared/contract';
import { ApprovalsService } from './approvals.service';
import { DecideApprovalDto } from './dto';

@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  @Get()
  list(@Query('status') status: string | undefined, @CurrentUser() user: AuthUser): Promise<Approval[]> {
    return this.approvals.list(status, user.sub);
  }

  @Post(':id/decide')
  decide(
    @Param('id') id: string,
    @Body() dto: DecideApprovalDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Approval> {
    return this.approvals.decide(id, dto.action, user.sub);
  }
}
