/**
 * Star Hospital Mobile App
 * Mock Network Delay Utility for Test & Offline Development
 */

export const mockNetworkDelay = (ms: number = 50): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export default mockNetworkDelay;
