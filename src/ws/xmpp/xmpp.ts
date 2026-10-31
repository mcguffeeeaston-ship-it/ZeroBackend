import net from "net";
import crypto from "crypto";
import logger from "../../utilites/logger";
import { getUserById, findOrCreateUser } from "../../utilites/database";

export interface XmppClient {
  id: string;
  accountId: string;
  displayName: string;
  jid: string;
  resource: string;
  authenticated: boolean;
  socket: net.Socket;
  lastPresence?: string;
  send: (data: string) => void;
  close: () => void;
}

export const xmppClients = new Map<string, XmppClient>();

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function parseTag(data: string, tag: string): string | null {
  const match = data.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1] : null;
}

export function parseAttribute(data: string, attr: string): string | null {
  const match = data.match(new RegExp(`${attr}=["']([^"']+)["']`));
  return match ? match[1] : null;
}

export class XmppServer {
  private static tcpServer?: net.Server;
  private static domain = process.env.XMPP_DOMAIN || "zero.local";
  private static port = parseInt(process.env.XMPP_PORT || "5222", 10);

  static start(): void {
    try {
      this.tcpServer = net.createServer((socket) => {
        const clientId = crypto.randomUUID().replace(/-/g, "");
        const client: XmppClient = {
          id: clientId,
          accountId: "",
          displayName: "",
          jid: "",
          resource: "",
          authenticated: false,
          socket,
          send: (data: string) => {
            if (!socket.destroyed) {
              socket.write(data);
            }
          },
          close: () => {
            socket.destroy();
          }
        };

        xmppClients.set(clientId, client);

        socket.on("data", (data) => {
          this.handleData(client, data.toString());
        });

        socket.on("error", (err) => {
          logger.debug(`XMPP client TCP error: ${err.message}`);
        });

        socket.on("close", () => {
          this.handleDisconnect(client);
        });
      });

      this.tcpServer.listen(this.port, () => {
        logger.info(`XMPP TCP Server listening on port ${this.port}`);
      });

      this.tcpServer.on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          logger.warn(`XMPP port ${this.port} is already in use. Skipping raw TCP XMPP server.`);
        } else {
          logger.error(`XMPP server error: ${err.message}`);
        }
      });
    } catch (err: any) {
      logger.error(`Failed to start XMPP TCP server: ${err?.message || err}`);
    }
  }

  private static handleDisconnect(client: XmppClient): void {
    if (client.authenticated) {
      logger.info(`XMPP client disconnected: ${client.displayName} (${client.accountId})`);

      const unavailable = `<presence from="${client.jid}" type="unavailable" />`;
      for (const other of xmppClients.values()) {
        if (other.id !== client.id && other.authenticated) {
          other.send(unavailable);
        }
      }
    }
    xmppClients.delete(client.id);
  }

  private static async handleData(client: XmppClient, data: string): Promise<void> {
    const domain = this.domain;

    if (data.includes("<stream:stream") || data.includes("<open ")) {
      client.send(
        `<?xml version="1.0"?><stream:stream xmlns="jabber:client" xmlns:stream="http://etherx.jabber.org/streams" from="${domain}" id="${client.id}" version="1.0">`
      );

      if (!client.authenticated) {
        client.send(
          `<stream:features><mechanisms xmlns="urn:ietf:params:xml:ns:xmpp-sasl"><mechanism>PLAIN</mechanism></mechanisms></stream:features>`
        );
      } else {
        client.send(
          `<stream:features><bind xmlns="urn:ietf:params:xml:ns:xmpp-bind"/><session xmlns="urn:ietf:params:xml:ns:xmpp-session"/></stream:features>`
        );
      }
      return;
    }

    if (data.includes("<auth ")) {
      const mechanism = parseAttribute(data, "mechanism");
      if (mechanism === "PLAIN") {
        const authData = parseTag(data, "auth") || "";
        const decoded = Buffer.from(authData, "base64").toString("utf-8");
        const parts = decoded.split("\0");
        const accountId = parts[1] || parts[0] || "zero_user";

        const user = (await getUserById(accountId)) || (await findOrCreateUser(accountId));
        client.accountId = user.accountId;
        client.displayName = user.username;
        client.authenticated = true;

        logger.info(`Authenticated XMPP client: ${client.displayName} (${client.accountId})`);
        client.send(`<success xmlns="urn:ietf:params:xml:ns:xmpp-sasl"/>`);
      }
      return;
    }

    if (data.includes("<bind xmlns=")) {
      const id = parseAttribute(data, "id") || "_bind_1";
      const resource = parseTag(data, "resource") || `V2:Fortnite:WIN:${crypto.randomUUID().replace(/-/g, "")}`;
      client.resource = resource;
      client.jid = `${client.accountId}@${domain}/${resource}`;

      client.send(
        `<iq type="result" id="${id}"><bind xmlns="urn:ietf:params:xml:ns:xmpp-bind"><jid>${client.jid}</jid></bind></iq>`
      );
      return;
    }

    if (data.includes("<session xmlns=")) {
      const id = parseAttribute(data, "id") || "_session_1";
      client.send(`<iq type="result" id="${id}"/>`);
      return;
    }

    if (data.includes('xmlns="urn:xmpp:ping"')) {
      const id = parseAttribute(data, "id");
      if (id) {
        client.send(`<iq to="${client.jid}" id="${id}" type="result"/>`);
      }
      return;
    }

    if (data.includes("<presence")) {
      const status = parseTag(data, "status");
      client.lastPresence = `<presence from="${client.jid}" to="__TO__">${
        status ? `<status>${escapeXml(status)}</status>` : ""
      }</presence>`;

      for (const other of xmppClients.values()) {
        if (other.id !== client.id && other.authenticated) {
          other.send(client.lastPresence.replace("__TO__", other.jid));
        }
      }
      return;
    }

    if (data.includes("<message")) {
      const to = parseAttribute(data, "to");
      const type = parseAttribute(data, "type");
      const body = parseTag(data, "body");

      if (to && body) {
        const targetAccountId = to.split("@")[0];
        for (const targetClient of xmppClients.values()) {
          if (targetClient.accountId === targetAccountId && targetClient.authenticated) {
            targetClient.send(
              `<message from="${client.jid}" to="${targetClient.jid}" type="${type || "chat"}"><body>${escapeXml(
                body
              )}</body></message>`
            );
            break;
          }
        }
      }
      return;
    }

    if (data.includes("</stream:stream>") || data.includes("<close ")) {
      client.close();
      return;
    }
  }
}

export default XmppServer;
