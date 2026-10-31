import { Hono } from "hono";
import { getSACCode, saveSACCode } from "../utilites/database";

const calendar = new Hono();

calendar.get("/fortnite/api/calendar/v1/timeline", (c) => {
  const now = new Date();
  const validFrom = "2019-10-15T00:00:00.000Z";
  const activeUntil = "9999-12-31T23:59:59.999Z";
  const dailyStoreEnd = new Date(Date.now() + 86400 * 1000).toISOString();
  const weeklyStoreEnd = new Date(Date.now() + 7 * 86400 * 1000).toISOString();

  const timeline = {
    channels: {
      "standalone-store": {},
      "client-matchmaking": {},
      tk: {
        states: [
          {
            validFrom,
            activeEvents: [],
            state: { k: [] }
          }
        ],
        cacheExpire: new Date(Date.now() + 30000).toISOString()
      },
      "featured-islands": {},
      "community-votes": {},
      "client-events": {
        states: [
          {
            validFrom,
            activeEvents: [
              {
                eventType: "EventFlag.Season11",
                activeUntil,
                activeSince: validFrom
              },
              {
                eventType: "EventFlag.LobbySeason11",
                activeUntil,
                activeSince: validFrom
              },
              {
                eventType: "EventFlag.WinterBattleBus",
                activeUntil,
                activeSince: validFrom
              },
              {
                eventType: "GP1",
                activeUntil,
                activeSince: validFrom
              },
              {
                eventType: "GP2",
                activeUntil,
                activeSince: validFrom
              },
              {
                eventType: "GP3",
                activeUntil,
                activeSince: validFrom
              },
              {
                eventType: "GP4",
                activeUntil,
                activeSince: validFrom
              },
              {
                eventType: "GP5",
                activeUntil,
                activeSince: validFrom
              }
            ],
            state: {
              activeStorefronts: [],
              eventNamedWeights: {},
              activeEvents: [],
              seasonNumber: 11,
              seasonTemplateId: "AthenaSeason:athenaseason11",
              matchXpBonusPoints: 0,
              eventPunchCardTemplateId: "",
              seasonBegin: "2019-10-15T00:00:00.000Z",
              seasonEnd: activeUntil,
              seasonDisplayedEnd: "2020-02-20T04:00:00.000Z",
              dailyStoreEnd,
              weeklyStoreEnd,
              sectionStoreEnds: {},
              rmtPromotion: "melody"
            }
          }
        ],
        cacheExpire: new Date(Date.now() + 30000).toISOString()
      }
    },
    currentTime: now.toISOString(),
    cacheIntervalMins: 15,
    eventsTimeOffsetHrs: 0
  };

  return c.json(timeline);
});

calendar.get("/affiliate/api/public/affiliates/slug/:slug", async (c) => {
  const slug = c.req.param("slug");
  let code = await getSACCode(slug);

  if (!code) {
    await saveSACCode(slug);
    code = await getSACCode(slug);
  }

  return c.json({
    id: code ? code.code : slug,
    slug: code ? code.code : slug,
    displayName: code ? code.code_higher : slug.toUpperCase(),
    code_higher: code ? code.code_higher : slug.toUpperCase(),
    status: "ACTIVE",
    verified: true
  });
});

export default calendar;
