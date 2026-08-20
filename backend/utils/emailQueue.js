/**
 * Lightweight in-memory email queue.
 *
 * Keeps SMTP off the auth request path without adding a new infrastructure dependency.
 * For larger deployments, this can be replaced with BullMQ + Redis later.
 */

import { sendVerificationEmail, sendPasswordResetEmail } from './sendEmail.js';

const queue = [];
let processing = false;
const CONCURRENCY = 2;
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;

async function processNext() {
  if (processing || queue.length === 0) return;

  processing = true;

  const job = queue.shift();
  if (!job) {
    processing = false;
    return;
  }

  try {
    if (job.type === 'verification') {
      await sendVerificationEmail(job.email, job.token);
    } else if (job.type === 'password-reset') {
      await sendPasswordResetEmail(job.email, job.token);
    }

    job.resolve?.({ queued: true });
  } catch (error) {
    job.retries = (job.retries || 0) + 1;

    if (job.retries < MAX_RETRIES) {
      setTimeout(() => {
        queue.push(job);
        processNext();
      }, RETRY_DELAY_MS * job.retries);
    } else {
      job.reject?.(error);
    }
  } finally {
    processing = false;
    if (queue.length > 0) {
      setImmediate(processNext);
    }
  }
}

export const enqueueEmail = (job) => {
  return new Promise((resolve, reject) => {
    const entry = { ...job, resolve, reject };
    queue.push(entry);

    if (queue.length <= CONCURRENCY) {
      setImmediate(processNext);
    }
  });
};

export const getEmailQueueStats = () => ({
  pending: queue.length,
  processing,
});
