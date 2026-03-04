import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const projectId = this.configService.get<string>('firebase.projectId');
    const privateKey = this.configService.get<string>('firebase.privateKey');
    const clientEmail = this.configService.get<string>('firebase.clientEmail');

    // Skip Firebase initialization if using placeholder credentials
    if (
      !projectId ||
      !privateKey ||
      !clientEmail ||
      projectId === 'your-project-id' ||
      privateKey.includes('Your Private Key')
    ) {
      this.logger.warn(
        'Firebase credentials not configured - using development mode without authentication',
      );
      return;
    }

    this.app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail,
      }),
    });

    this.logger.log('Firebase Admin initialized successfully');
  }

  getAuth(): admin.auth.Auth {
    if (!this.app) {
      throw new Error(
        'Firebase not initialized - configure FIREBASE_* environment variables',
      );
    }
    return this.app.auth();
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.app) {
      throw new Error(
        'Firebase not initialized - configure FIREBASE_* environment variables',
      );
    }
    try {
      return await this.getAuth().verifyIdToken(idToken);
    } catch (error) {
      this.logger.error('Failed to verify Firebase token', error);
      throw error;
    }
  }

  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    if (!this.app) {
      throw new Error(
        'Firebase not initialized - configure FIREBASE_* environment variables',
      );
    }
    return this.getAuth().getUser(uid);
  }

  async deleteUser(uid: string): Promise<void> {
    if (!this.app) {
      throw new Error(
        'Firebase not initialized - configure FIREBASE_* environment variables',
      );
    }
    await this.getAuth().deleteUser(uid);
  }

  async setCustomClaims(uid: string, claims: object): Promise<void> {
    if (!this.app) {
      throw new Error(
        'Firebase not initialized - configure FIREBASE_* environment variables',
      );
    }
    await this.getAuth().setCustomUserClaims(uid, claims);
  }
}
