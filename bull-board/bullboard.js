const express = require('express');
const fastify = require('fastify');
const Queue = require('bull');
const { createBullBoard } = require('bull-board');
const { BullAdapter } = require('bull-board/bullAdapter');
const { statusesPayloadQueue } = require('../queue/statusesPayloadQueue');
const { contactsPayloadQueue } = require('../queue/contactsPayloadQueue');
const { businessesPayloadQueue } = require('../queue/businessesPayloadQueue');
const { threadsqueue } = require('../queue/threadspawnQueeue');
const { customCallbackPayloadQueue } = require('../queue/customCallbackPayloadQueue');
// const threadspawnQueeue = new Queue('MessagesPayload', redis);
const { router, setQueues, replaceQueues, addQueue, removeQueue } = createBullBoard([
  new BullAdapter(statusesPayloadQueue),
  new BullAdapter(contactsPayloadQueue),
  new BullAdapter(businessesPayloadQueue),
  new BullAdapter(threadsqueue),
  new BullAdapter(customCallbackPayloadQueue, { readOnlyMode: false })

]);

const app = express();

app.use('/queues/', router);

const PORT = 5122;


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Running on http://13.200.170.27:${PORT}/queues/`);
});
