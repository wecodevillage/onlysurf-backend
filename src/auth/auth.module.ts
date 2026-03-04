import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  providers: [FirebaseService, AuthService],
  controllers: [AuthController],
  exports: [FirebaseService, AuthService],
})
export class AuthModule {}
