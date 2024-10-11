import 'dotenv/config';
import { Module, Global, Logger } from '@nestjs/common';
import { Kafka, Producer, Consumer, Admin, Partitioners } from 'kafkajs';

export type KafkaOptions = { clientId: string; brokers: string[] };

export const getKafkaOptions = (): KafkaOptions => {
  return {
    clientId: process.env.KAFKA_CLIENT_ID as string,
    brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
  };
};

export const getKafkaAdmin = async (): Promise<Admin> => {
  try {
    const kafka = new Kafka(getKafkaOptions());
    const admin = kafka.admin();
    await admin.connect();
    Logger.log('Kafka admin connection established successfully');
    return admin;
  } catch (error) {
    Logger.fatal(`Kafka admin connection error: ${JSON.stringify(error)}`);
    throw error;
  }
};

export const getKafkaProducer = async (): Promise<Producer> => {
  try {
    const kafka = new Kafka(getKafkaOptions());
    const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });
    await producer.connect();
    Logger.log('Kafka producer connection established successfully');
    return producer;
  } catch (error) {
    Logger.fatal(`Kafka producer connection error: ${JSON.stringify(error)}`);
    throw error;
  }
};

export const getKafkaConsumer = async (): Promise<Consumer> => {
  try {
    const options = getKafkaOptions();
    const kafka = new Kafka(options);
    const consumer = kafka.consumer({ groupId: options.clientId });
    await consumer.connect();
    Logger.log('Kafka consumer connection established successfully');
    return consumer;
  } catch (error) {
    Logger.fatal(`Kafka consumer connection error: ${JSON.stringify(error)}`);
    throw error;
  }
};

export const disconnectKafkaClient = async (client: Admin | Producer | Consumer): Promise<void> => {
  await client.disconnect();
};

@Global()
@Module({
  providers: [
    {
      provide: 'KAFKA_TOPIC',
      useValue: process.env.KAFKA_TOPIC_PROMPT_RESULTS_TO_STORE as string,
    },
    {
      provide: 'KAFKA_PRODUCER',
      useFactory: getKafkaProducer,
    },
    {
      provide: 'KAFKA_CONSUMER',
      useFactory: getKafkaConsumer,
    },
    {
      provide: 'KAFKA_ADMIN',
      useFactory: getKafkaAdmin,
    },
  ],
  exports: ['KAFKA_ADMIN', 'KAFKA_PRODUCER', 'KAFKA_CONSUMER', 'KAFKA_TOPIC'],
})
export class KafkaModule {}
