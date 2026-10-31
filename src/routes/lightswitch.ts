import { Hono } from "hono";

const lightswitch = new Hono();

const statusPayload = [
  {
    serviceInstanceId: "fortnite",
    status: "UP",
    message: "Zero Backend Fortnite is Online",
    maintenanceURI: null,
    overrideCatalogIds: [],
    allowedActions: ["PLAY", "DOWNLOAD"],
    banned: false,
    launcherInfoDTO: {
      appName: "Fortnite",
      catalogItemId: "4fe75bbc5a674f4f9b356b5c90567da5",
      namespace: "fn"
    }
  }
];

lightswitch.get("/service/bulk/status", (c) => {
  return c.json(statusPayload);
});

lightswitch.get("/service/Fortnite/status", (c) => {
  return c.json(statusPayload[0]);
});

export default lightswitch;
