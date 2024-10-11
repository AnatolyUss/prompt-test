// const crypto = require('node:crypto');
//
// const text = 'c'.repeat(8000000); // Creating a string with 8000000 'c' characters.
// const start = new Date().getTime();
// const hash = crypto.createHash('sha256').update(text).digest('hex');
// console.log(`Time taken: ${new Date().getTime() - start} ms`);
// console.log(`SHA-256 hash: ${hash}`);
//
// ////////////////////////// READ /////////////////////////////////////////////////
// const { Kafka } = require('kafkajs');
// const clientId = 'mock-up-kafka-consumer-client';
// const brokers = ['localhost:9092'];
// const topic = 'events';
// const kafka = new Kafka({ clientId, brokers });
// const consumer = kafka.consumer({ groupId: clientId });
// const consume = async () => {
//   let data = [];
//   await consumer.connect();
//   await consumer.subscribe({ topic });
//   await consumer.run({
//     eachMessage: ({ message }) => {
//       console.log(`received message: ${message.value}`);
//       data.push(message);
//     },
//   });
//   return data;
// };
// consume()
//   .then(() => {
//     console.log('produced successfully');
//   })
//   .catch(err => console);
//
// ////////////////////////// WRITE /////////////////////////////////////////////////
// const { Kafka } = require('kafkajs');
// const clientId = 'mock-up-kafka-producer-client';
// const brokers = ['localhost:9092'];
// const topic = 'events';
// const kafka = new Kafka({ clientId, brokers });
// const producer = kafka.producer();
//
// const produce = async () => {
//   await producer.connect();
//   await producer.send({
//     topic,
//     messages: [
//       { key: 'key1', value: 'hello world', partition: 0 },
//       { key: 'key2', value: 'hey hey!', partition: 1 },
//     ],
//   });
// };
//
// produce()
//   .then(() => {
//     console.log('produced successfully');
//   })
//   .catch(err => console);
