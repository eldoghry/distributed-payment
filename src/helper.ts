export const sleep = (ms: number) =>
  new Promise((resolve) => {
    console.log(`Sleeping for ${ms} ms...`);
    setTimeout(resolve, ms);
  });

export const retry = async <T>(
  fn: () => Promise<T>,
  retries: number,
  delayMs: number,
): Promise<T> => {
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(delayMs);
        console.log(`Retrying... Attempt ${attempt + 1}`);
      }
    }
  }

  console.log('All retry attempts failed.');
  throw lastError;
};
