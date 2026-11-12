import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { Session } from '../shared/contract';
import { CreateSessionDto, UpdateSessionDto } from './dto';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<Session[]> {
    return this.sessions.list(user.sub);
  }

  @Post()
  create(@Body() dto: CreateSessionDto, @CurrentUser() user: AuthUser): Promise<Session> {
    return this.sessions.create(dto, user.sub);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<Session> {
    return this.sessions.get(id, user.sub);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSessionDto, @CurrentUser() user: AuthUser): Promise<Session> {
    return this.sessions.update(id, dto, user.sub);
  }

  @Delete(':id')
  archive(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<void> {
    return this.sessions.archive(id, user.sub);
  }
}
