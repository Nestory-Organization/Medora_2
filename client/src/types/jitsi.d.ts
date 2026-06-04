export interface JitsiApi {
  addEventListener: (event: string, listener: (...args: unknown[]) => void) => void;
  removeEventListener: (event: string, listener: (...args: unknown[]) => void) => void;
  dispose: () => void;
  getParticipantsInfo: (callback: (participants: unknown[]) => void) => void;
  executeCommand: (command: string, options?: unknown) => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: unknown) => JitsiApi;
  }
}