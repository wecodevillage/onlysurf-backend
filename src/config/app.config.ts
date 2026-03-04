import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiVersion: process.env.API_VERSION || 'v1',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3001',
  ],
}));
