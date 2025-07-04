declare global {
  interface Window {
    api: {
      getRecentClips: () => Promise<Clip[]>;
      onClipAdded: (callback: () => void) => void;
    };
  }
}

export {};