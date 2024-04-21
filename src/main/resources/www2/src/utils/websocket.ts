export type ReconnectingWebSocketConfig = {
  automaticOpen?: boolean;
  reconnectInterval?: number;
  maxReconnectInterval?: number;
  reconnectDecay?: number;
  timeoutInterval?: number;
  maxReconnectAttempts?: number;
  protocols?: string | string[];
};

export class ReconnectingWebSocket {
  static CONNECTING = WebSocket.CONNECTING;
  static OPEN = WebSocket.OPEN;
  static CLOSING = WebSocket.CLOSING;
  static CLOSED = WebSocket.CLOSED;

  protocols: string | string[];
  reconnectAttempts = 0;
  readyState = WebSocket.CONNECTING;

  private ws: WebSocket;
  private forcedClose = false;
  private timedOut = false;
  private config: ReconnectingWebSocketConfig;
  private events: {
    onopen?: (cb: WebSocketEventMap["open"]) => void;
    onclose?: (cb: CloseEvent) => void;
    onmessage?: (cb: WebSocketEventMap["message"]) => void;
    onerror?: (cb: WebSocketEventMap["error"]) => void;
  } = {};

  constructor(public url: string, config: ReconnectingWebSocketConfig = {}) {
    this.config = {
      ...this.getDefaultConfig(),
      ...config,
    };

    if (this.config.automaticOpen) {
      this.open();
    }
  }

  open(reconnectAttempt = false) {
    this.ws = new WebSocket(this.url, this.config.protocols);

    if (reconnectAttempt) {
      if (
        this.config.maxReconnectAttempts &&
        this.reconnectAttempts > this.config.maxReconnectAttempts
      ) {
        return;
      }
    }

    const timeout = setTimeout(() => {
      this.timedOut = true;
      this.ws.close();
      this.timedOut = false;
    }, this.config.timeoutInterval);

    this.ws.onopen = (evt) => {
      clearTimeout(timeout);
      this.readyState = WebSocket.OPEN;
      this.reconnectAttempts = 0;

      if (this.events.onopen) this.events.onopen(evt);
    };

    this.ws.onclose = (evt) => {
      clearTimeout(timeout);

      this.ws = null;

      if (this.forcedClose) {
        this.readyState = WebSocket.CLOSED;
        if (this.events.onclose) this.events.onclose(evt);
      } else {
        this.readyState = WebSocket.CONNECTING;

        if (!reconnectAttempt && !this.timedOut) {
          if (this.events.onclose) this.events?.onclose(evt);
        }

        const timeoutDelay = this.config.reconnectInterval * Math.pow(this.config.reconnectDecay, this.reconnectAttempts);

        setTimeout(() => {
          this.reconnectAttempts++;
          this.open(true);
        }, timeoutDelay > this.config.maxReconnectInterval ? this.config.maxReconnectInterval : timeoutDelay);
      };
    };

    this.ws.onmessage = (evt) => {
      console.log(evt);
      console.log(this)
      this.events.onmessage(evt);
    };

    this.ws.onerror = (evt) => {
      if (this.events.onerror) this.events.onerror(evt);
    };
  }

  set onopen(cb: (evt: WebSocketEventMap["error"]) => void) {
    this.events.onopen = cb;
  }

  set onclose(cb: (evt: CloseEvent) => void) {
    this.events.onclose = cb;
  }

  set onerror(cb: (evt: WebSocketEventMap["error"]) => void) {
    this.events.onerror = cb;
  }

  set onmessage(cb: (evt: WebSocketEventMap["message"]) => void) {
    this.events.onmessage = cb;
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    return this.ws?.send(data);
  }

  close(code = 1000, reason?: string) {
    this.forcedClose = true;

    this.ws?.close(code, reason);
  }

  refresh() {
    this.ws?.close();
  }

  private getDefaultConfig() {
    return {
      automaticOpen: true,
      reconnectInterval: 1000,
      maxReconnectInterval: 30000,
      reconnectDecay: 1.5,
      timeoutInterval: 2000,
      maxReconnectAttempts: null,
    } as ReconnectingWebSocketConfig;
  }
}