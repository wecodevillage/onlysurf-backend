import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// Config
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import firebaseConfig from './config/firebase.config';
import muxConfig from './config/mux.config';
import redisConfig from './config/redis.config';
import stripeConfig from './config/stripe.config';
import resendConfig from './config/resend.config';
import { validationSchema } from './config/validation.schema';

// Modules
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

// Feature Modules
import { AcademiesModule } from './academies/academies.module';
import { AthletesModule } from './athletes/athletes.module';
import { SessionsModule } from './sessions/sessions.module';
import { WavesModule } from './waves/waves.module';
import { SavedWavesModule } from './saved-waves/saved-waves.module';
import { BillingModule } from './billing/billing.module';
import { MediaModule } from './media/media.module';

// Guards
import { FirebaseAuthGuard } from './auth/firebase-auth.guard';

@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        firebaseConfig,
        muxConfig,
        redisConfig,
        stripeConfig,
        resendConfig,
      ],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10) * 1000,
        limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      },
    ]),

    // Core modules
    PrismaModule,
    AuthModule,
    HealthModule,

    // V1 Feature Modules
    AcademiesModule,
    AthletesModule,
    SessionsModule,
    WavesModule,
    SavedWavesModule,
    BillingModule,
    MediaModule,
  ],
  providers: [
    // Global Firebase Auth Guard
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard,
    },
    // Global Rate Limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
