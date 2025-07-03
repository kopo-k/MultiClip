declare global {
  interface Window {
    api: {
      getRecentClips: () => Promise<Clip[]>;
    };
  }
}

export {};