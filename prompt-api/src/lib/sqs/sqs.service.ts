import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { AWSError } from 'aws-sdk';
import {
  ReceiveMessageResult,
  SendMessageResult,
  CreateQueueRequest,
  CreateQueueResult,
  DeleteQueueRequest,
  ListQueuesRequest,
  ListQueuesResult,
} from 'aws-sdk/clients/sqs';

@Injectable()
export class SqsService {
  private getQueueUrl(queue: string): string {
    return `${process.env.LOCALSTACK_SQS_QUEUE_URL_PREFIX as string}${queue}`;
  }

  private getSqsClient(): AWS.SQS {
    return new AWS.SQS({
      endpoint: new AWS.Endpoint(process.env.LOCALSTACK_AWS_ENDPOINT as string),
      region: process.env.LOCALSTACK_AWS_REGION as string,
      accessKeyId: 'NA', // Required by LocalStack.
      secretAccessKey: 'NA', // Required by LocalStack.
    });
  }

  listQueues(): Promise<string[]> {
    return new Promise<string[]>((resolve, reject): void => {
      const sqsClient = this.getSqsClient();
      const params: ListQueuesRequest = {};
      sqsClient.listQueues(params, (err: AWSError, data: ListQueuesResult): void =>
        err ? reject(err) : resolve(data.QueueUrls || []),
      );
    });
  }

  createQueue(queue: string): Promise<CreateQueueResult> {
    return new Promise<CreateQueueResult>((resolve, reject): void => {
      const sqsClient = this.getSqsClient();
      const params: CreateQueueRequest = { QueueName: queue };
      sqsClient.createQueue(params, (err: AWSError, data: CreateQueueResult): void =>
        err ? reject(err) : resolve(data),
      );
    });
  }

  deleteQueue(queue: string): Promise<void> {
    return new Promise<void>((resolve, reject): void => {
      const sqsClient = this.getSqsClient();
      const params: DeleteQueueRequest = { QueueUrl: this.getQueueUrl(queue) };
      sqsClient.deleteQueue(params, (err: AWSError): void => (err ? reject(err) : resolve()));
    });
  }

  receiveMessage(queue: string): Promise<any> {
    return new Promise<any>((resolve, reject): void => {
      const sqsClient = this.getSqsClient();
      const params: AWS.SQS.Types.ReceiveMessageRequest = {
        QueueUrl: this.getQueueUrl(queue),
        VisibilityTimeout: +(process.env
          .LOCALSTACK_SQS_RECEIVE_MESSAGE_VISIBILITY_TIMEOUT as string),
      };

      sqsClient.receiveMessage(params, (err: AWSError, data: ReceiveMessageResult): void => {
        if (err) {
          reject(err);
        } else {
          const message =
            data.Messages && data.Messages.length !== 0 ? data.Messages[0].Body : null;
          resolve(message);
        }
      });
    });
  }

  sendMessage(queue: string, data: string): Promise<SendMessageResult> {
    return new Promise<SendMessageResult>((resolve, reject): void => {
      const sqsClient = this.getSqsClient();
      const params: AWS.SQS.Types.SendMessageRequest = {
        QueueUrl: this.getQueueUrl(queue),
        MessageBody: data,
      };

      sqsClient.sendMessage(params, (err: AWSError, data: SendMessageResult): void =>
        err ? reject(err) : resolve(data),
      );
    });
  }
}
