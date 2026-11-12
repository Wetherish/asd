import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { Message } from '../shared/contract';
import { SendMessageDto } from './dto';
import { MessagesService } from './messages.service';

@Controller('sessions/:sessionId/messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get()
  list(@Param('sessionId') sessionId: string, @CurrentUser() user: AuthUser): Promise<Message[]> {
    return this.messages.list(sessionId, user.sub);
  }

  @Post()
  send(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Message> {
    return this.messages.send(sessionId, user.sub, dto.body);
  }
}
