interface ChromeRuntime {
  sendMessage: (
    extensionId: string,
    message: unknown,
    callback: (response: unknown) => void
  ) => void;
  lastError: { message?: string } | undefined;
}

declare const chrome: { runtime: ChromeRuntime };

const EXTENSION_ID = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID;

const SEND_TIMEOUT_MS = 60_000;

export function isExtensionAvailable(): boolean {
  return (
    !!EXTENSION_ID &&
    typeof globalThis !== "undefined" &&
    "chrome" in globalThis &&
    !!(globalThis as unknown as { chrome?: { runtime?: { sendMessage?: unknown } } })
      .chrome?.runtime?.sendMessage
  );
}

export function sendExtensionMessage<T>(message: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Extension message timed out"));
    }, SEND_TIMEOUT_MS);

    chrome.runtime.sendMessage(EXTENSION_ID!, message, (response: unknown) => {
      clearTimeout(timer);
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response as T);
    });
  });
}
