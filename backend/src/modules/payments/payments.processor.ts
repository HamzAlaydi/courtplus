import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Injectable, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { PaymentsService } from './payments.service';

export enum PaymentJobType {
  PAYMENT_CANCELLATION = 'payment_cancellation',
}

export interface PaymentJobData {
  paymentId: string;
  jobType: PaymentJobType;
}

@Processor('payments')
@Injectable()
export class PaymentsProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentsProcessor.name);

  constructor(
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
  ) {
    super();
  }

  async process(job: Job<PaymentJobData>): Promise<void> {
    const { paymentId, jobType } = job.data;
    this.logger.log(`Processing job ${job.id} - type: ${jobType}, paymentId: ${paymentId}`);

    try {
      switch (jobType) {
        case PaymentJobType.PAYMENT_CANCELLATION:
          await this.processPaymentCancellation(paymentId);
          break;
        default:
          this.logger.warn(`Unknown job type: ${jobType}`);
      }
    } catch (error) {
      this.logger.error(`Error processing job for payment ${paymentId}:`, error);
      throw error;
    }
  }

  private async processPaymentCancellation(paymentId: string): Promise<void> {
    this.logger.log(`Processing payment cancellation for payment ${paymentId}`);
    await this.paymentsService.cancelPayment(paymentId);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<PaymentJobData>, error: Error) {
    const { paymentId, jobType } = job.data;
    const attemptsMade = job.attemptsMade;
    const maxAttempts = job.opts.attempts || 3;

    if (attemptsMade >= maxAttempts) {
      this.logger.error(
        `Job ${job.id} permanently failed after ${attemptsMade} attempts. ` +
        `Payment: ${paymentId}, Type: ${jobType}, Error: ${error.message}`,
        error.stack,
      );
    } else {
      this.logger.warn(
        `Job ${job.id} failed (attempt ${attemptsMade}/${maxAttempts}). ` +
        `Payment: ${paymentId}, Type: ${jobType}, Error: ${error.message}`,
      );
    }
  }
}
