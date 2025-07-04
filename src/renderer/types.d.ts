declare global {
  /*
  window.api というオブジェクトに、2つのメソッド getRecentClips() と onClipAdded() があることを型として定義する
  */
  interface Window {
    api: {
      //引数なしで呼び出すと、Clip型の配列（リスト）を Promise で返す関数
      getRecentClips: () => Promise<Clip[]>;
      //引数としてコールバック関数を受け取り、何も返さない関数
      onClipAdded: (callback: () => void) => void;
    };
  }
}

export {};