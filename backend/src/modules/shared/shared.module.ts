import { Module, Global } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { TwilioService } from './services/twilio.service';
import { S3Service } from './services/s3.service';
import { FirebaseService } from './services/firebase.service';

@Global()
@Module({
  providers: [EmailService, TwilioService, S3Service, FirebaseService],
  exports: [EmailService, TwilioService, S3Service, FirebaseService],
})
export class SharedModule {}
