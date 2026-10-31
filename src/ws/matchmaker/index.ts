import crypto from "crypto";
import logger from "../../utilites/logger";
import { getAvailableSession } from "../../utilites/MatchmakingFunctions";
import {
  sendConnecting,
  sendWaiting,
  sendQueued,
  sendSessionAssignment,
  sendErrorMessage
} from "./operations";

export interface MatchmakerSocketData {
  ticketId: string;
  accountId: string;
  timers: Timer[];
}

export const matchmakerWebSocketHandler = {
  open(ws: any) {
    const ticketId = crypto.randomUUID().replace(/-/g, "");
    const timers: Timer[] = [];

    ws.data = {
      ticketId,
      accountId: ws.data?.accountId || "unknown",
      timers
    };

    logger.info(`Matchmaker client connected (ticket: ${ticketId})`);

    sendConnecting(ws);

    const t1 = setTimeout(() => {
      try {
        sendWaiting(ws, 1);
      } catch (e) {}
    }, 500);
    timers.push(t1);

    const t2 = setTimeout(() => {
      try {
        sendQueued(ws, ticketId, 1, 1);
      } catch (e) {}
    }, 1200);
    timers.push(t2);

    const t3 = setTimeout(() => {
      try {
        const session = getAvailableSession();
        const matchId = crypto.randomUUID().replace(/-/g, "");
        sendSessionAssignment(ws, matchId, session.id);
        logger.info(
          `Matchmaker assigned session ${session.id} (${session.serverAddress}:${session.serverPort}) to client`
        );
      } catch (err: any) {
        sendErrorMessage(ws, err?.message || "Matchmaking error");
      }
    }, 2200);
    timers.push(t3);
  },

  message(ws: any, message: string | Buffer) {
    logger.debug(`Matchmaker received message: ${message.toString()}`);
  },

  close(ws: any) {
    logger.info(`Matchmaker client disconnected`);
    if (ws.data?.timers) {
      for (const t of ws.data.timers) {
        clearTimeout(t);
      }
    }
  }
};

export default matchmakerWebSocketHandler;
