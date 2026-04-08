type Job<T = unknown> = {
  id: string;
  attempts: number;
  maxAttempts: number;
  payload: T;
  run: (payload: T) => Promise<void>;
};

const queue: Array<Job<unknown>> = [];

export function enqueueJob<T>(job: Omit<Job<T>, "attempts">) {
  queue.push({ ...job, attempts: 0 } as Job<unknown>);
}

export async function processQueue() {
  while (queue.length > 0) {
    const job = queue.shift();
    if (!job) continue;
    try {
      await job.run(job.payload);
    } catch (error) {
      job.attempts += 1;
      if (job.attempts < job.maxAttempts) {
        queue.push(job);
      } else {
        console.error("Job failed permanently", { jobId: job.id, error });
      }
    }
  }
}
