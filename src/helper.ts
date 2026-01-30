export const delay = (ms: number) =>
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
        await delay(delayMs);
        console.log(`Retrying... Attempt ${attempt + 1}`);
      }
    }
  }

  console.log('All retry attempts failed.');
  throw lastError;
};

export const randomFlag = (probability: number = 0.5): boolean => {
  return Math.random() < probability;
};

export const randomMs = (maxMs: number = 3000): number => {
  return Math.floor(Math.random() * maxMs); // Random ms between 0 and maxMs
};
