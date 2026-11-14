import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { Public } from '../common/public.decorator';
import { Artifact } from '../shared/contract';
import { CreateShareLinkDto, UnlockShareLinkDto } from './dto';
import { ShareLinksService, ShareLinkResponse } from './share-links.service';

@Controller()
export class ShareLinksController {
  constructor(private readonly shareLinks: ShareLinksService) {}

  @Post('artifacts/:id/share-links')
  create(
    @Param('id') id: string,
    @Body() dto: CreateShareLinkDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ShareLinkResponse> {
    return this.shareLinks.create(id, dto, user.sub);
  }

  @Delete('artifacts/:id/share-links/:linkId')
  revoke(
    @Param('id') id: string,
    @Param('linkId') linkId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.shareLinks.revoke(id, linkId, user.sub);
  }

  @Public()
  @Get('share/:token')
  getByToken(
    @Param('token') token: string,
    @Query('key') key?: string,
  ): Promise<{ needsPassword: boolean; artifact?: Artifact }> {
    return this.shareLinks.getByToken(token, key);
  }

  @Public()
  @Post('share/:token/unlock')
  unlock(@Param('token') token: string, @Body() dto: UnlockShareLinkDto): Promise<{ key: string }> {
    return this.shareLinks.unlock(token, dto.password);
  }
}
