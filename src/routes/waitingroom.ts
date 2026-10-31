import { Hono } from "hono";

const waitingroom = new Hono();

waitingroom.get("/waitingroom", (c) => {
  return c.body(null, 204);
});

export default waitingroom;
