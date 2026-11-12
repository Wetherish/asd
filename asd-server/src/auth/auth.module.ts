import { Module } from '@nestjs/common';
import { AuthController, UsersController } from './auth.controller';
import { AuthService } from './auth.service';
import { CognitoService } from './cognito.service';

@Module({
  controllers: [AuthController, UsersController],
  providers: [AuthService, CognitoService],
})
export class AuthModule {}
