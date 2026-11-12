import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { Artifact } from '../shared/contract';
import { ArtifactsService } from './artifacts.service';
import { CreateArtifactDto, ShareArtifactDto, UpdateArtifactDto } from './dto';

@Controller()
export class ArtifactsController {
  constructor(private readonly artifacts: ArtifactsService) {}

  @Get('sessions/:sessionId/artifacts')
  listBySession(@Param('sessionId') sessionId: string, @CurrentUser() user: AuthUser): Promise<Artifact[]> {
    return this.artifacts.listBySession(sessionId, user.sub);
  }

  @Post('sessions/:sessionId/artifacts')
  create(
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateArtifactDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Artifact> {
    return this.artifacts.create(sessionId, dto, user.sub);
  }

  @Get('artifacts/:id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<Artifact> {
    return this.artifacts.get(id, user.sub);
  }

  @Patch('artifacts/:id')
  update(@Param('id') id: string, @Body() dto: UpdateArtifactDto, @CurrentUser() user: AuthUser): Promise<Artifact> {
    return this.artifacts.update(id, dto, user.sub);
  }

  @Delete('artifacts/:id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<void> {
    return this.artifacts.remove(id, user.sub);
  }

  @Post('artifacts/:id/share')
  share(@Param('id') id: string, @Body() dto: ShareArtifactDto, @CurrentUser() user: AuthUser): Promise<Artifact> {
    return this.artifacts.share(id, dto.personIds, (dto.role ?? 'viewer') as 'owner' | 'editor' | 'viewer', user.sub);
  }
}
