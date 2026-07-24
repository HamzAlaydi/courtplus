import { App, initializeApp } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import {
  BatchResponse,
  getMessaging,
  Messaging,
} from 'firebase-admin/messaging';
import firebase from 'firebase-admin';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firebaseConfig } from '../firebase.config';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

export const FIREBASE_INVALID_TOKENS_EVENT = 'firebase.invalid_tokens';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private app: App;
  private auth: Auth;
  private messaging: Messaging;

  constructor(
    readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    const buff = Buffer.from(
      configService.get('firebase.privateKey'),
      'base64',
    );
    const privateKey = buff.toString('utf-8');
    this.app = initializeApp({
      credential: firebase.credential.cert({
        ...firebaseConfig,
        //@ts-expect-error type error
        project_id: configService.get('firebase.projectId'),
        private_key_id: configService.get('firebase.privateKeyId'),
        private_key: privateKey,
      }),
    });
    this.auth = getAuth(this.app);
    this.messaging = getMessaging(this.app);
  }

  async verifyIdToken(token: string) {
    return this.auth.verifyIdToken(token);
  }

  async sendNotification(
    tokens: string | string[],
    notification: Pick<
      Notification,
      'data' | 'type' | 'title' | 'image' | 'content'
    >,
  ) {
    const { data, type, title, image, content } = notification;
    const tokensArray = Array.isArray(tokens) ? tokens : [tokens];
    const response = await this.messaging.sendEachForMulticast({
      notification: {},
      apns: {
        headers: {
          'apns-push-type': 'alert',
          'apns-priority': '10',
        },
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            //TODO: category,threadId
            category: 'UPDATE',
            mutableContent: true,
            threadId: 'updates',
            contentAvailable: true,
            alert: {
              title,
              body: content,
            },
            userInfo: {
              data: JSON.stringify(data),
              type,
            },
          },
        },
      },
      android: {
        priority: 'high',
        notification: {
          title,
          body: content,
          imageUrl: image,
          //TODO: channelId,clickAction
          channelId: 'updates',
          clickAction: 'OPEN_UPDATES',
          sound: 'default',
        },
      },
      tokens: tokensArray,
      data: {
        data: JSON.stringify(data),
        type,
      },
    });

    if (response.failureCount > 0) {
      const invalidTokens: string[] = [];

      response.responses.forEach((r, index) => {
        const code = r.error?.code || '';
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          invalidTokens.push(tokensArray[index]);
        }
      });

      if (invalidTokens.length > 0) {
        this.logger.warn(`Found ${invalidTokens.length} invalid FCM tokens, emitting cleanup event`);
        this.eventEmitter.emit(FIREBASE_INVALID_TOKENS_EVENT, { tokens: invalidTokens });
      }
    }
  }
}
