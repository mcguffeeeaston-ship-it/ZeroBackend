import logger from "../../utilites/logger";

export interface MmsMessage {
  name: string;
  payload: Record<string, any>;
}

export function sendConnecting(ws: { send: (data: string) => void }): void {
  const msg: MmsMessage = {
    name: "Connecting",
    payload: {}
  };
  ws.send(JSON.stringify(msg));
}

export function sendWaiting(ws: { send: (data: string) => void }, totalPlayers: number = 1): void {
  const msg: MmsMessage = {
    name: "Waiting",
    payload: {
      totalPlayers
    }
  };
  ws.send(JSON.stringify(msg));
}

export function sendQueued(
  ws: { send: (data: string) => void },
  ticketId: string,
  queuedPlayers: number = 1,
  estimatedWaitSec: number = 1
): void {
  const msg: MmsMessage = {
    name: "Queued",
    payload: {
      ticketId,
      queuedPlayers,
      estimatedWaitSec,
      status: 3
    }
  };
  ws.send(JSON.stringify(msg));
}

export function sendSessionAssignment(
  ws: { send: (data: string) => void },
  matchId: string,
  sessionId: string
): void {
  const msg: MmsMessage = {
    name: "SessionAssignment",
    payload: {
      matchId,
      sessionId
    }
  };
  ws.send(JSON.stringify(msg));
}

export function sendErrorMessage(
  ws: { send: (data: string) => void },
  errorMessage: string
): void {
  const msg: MmsMessage = {
    name: "Error",
    payload: {
      errorMessage
    }
  };
  ws.send(JSON.stringify(msg));
}
