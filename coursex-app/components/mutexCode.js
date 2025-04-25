const createMutex = () => {
  let isLocked = false;
  let waitingQueue = [];

  return {
    lock: async () => {
      while (isLocked) {
        await new Promise((resolve) => waitingQueue.push(resolve));
      }
      isLocked = true;
    },
    unlock: () => {
      isLocked = false;
      if (waitingQueue.length > 0) {
        waitingQueue.shift()();
      }
    },
  };
};

export const asyncStorageMutex = createMutex();
