import logger from "./logger";
import { sendShopNotification } from "../discord/index";

export interface ShopItem {
  id: string;
  name: string;
  type: string;
  rarity: string;
  price: number;
  templateId: string;
}

const FALLBACK_COSMETICS: ShopItem[] = [
  { id: "cid_183_athena_commando_m_modernmilitaryred", name: "Havoc", type: "AthenaCharacter", rarity: "Epic", price: 1500, templateId: "AthenaCharacter:cid_183_athena_commando_m_modernmilitaryred" },
  { id: "cid_171_athena_commando_m_sharpdresser", name: "Wildcard", type: "AthenaCharacter", rarity: "Legendary", price: 2000, templateId: "AthenaCharacter:cid_171_athena_commando_m_sharpdresser" },
  { id: "cid_029_athena_commando_f_halloween", name: "Ghoul Trooper", type: "AthenaCharacter", rarity: "Epic", price: 1500, templateId: "AthenaCharacter:cid_029_athena_commando_f_halloween" },
  { id: "cid_030_athena_commando_m_halloween", name: "Skull Trooper", type: "AthenaCharacter", rarity: "Epic", price: 1500, templateId: "AthenaCharacter:cid_030_athena_commando_m_halloween" },
  { id: "cid_175_athena_commando_m_celestial", name: "Galaxy", type: "AthenaCharacter", rarity: "Epic", price: 1500, templateId: "AthenaCharacter:cid_175_athena_commando_m_celestial" },
  { id: "cid_342_athena_commando_m_streetops", name: "Sunstrider", type: "AthenaCharacter", rarity: "Epic", price: 1500, templateId: "AthenaCharacter:cid_342_athena_commando_m_streetops" },
  { id: "cid_116_athena_commando_m_carbideblack", name: "Omega", type: "AthenaCharacter", rarity: "Legendary", price: 2000, templateId: "AthenaCharacter:cid_116_athena_commando_m_carbideblack" },
  { id: "cid_562_athena_commando_m_darkagent", name: "Chaos Agent", type: "AthenaCharacter", rarity: "Epic", price: 1500, templateId: "AthenaCharacter:cid_562_athena_commando_m_darkagent" },
  { id: "cid_683_athena_commando_f_harleyquinn", name: "Harley Quinn", type: "AthenaCharacter", rarity: "Epic", price: 1500, templateId: "AthenaCharacter:cid_683_athena_commando_f_harleyquinn" },
  { id: "eid_floss", name: "Floss", type: "AthenaDance", rarity: "Rare", price: 500, templateId: "AthenaDance:eid_floss" },
  { id: "eid_fresh", name: "Fresh", type: "AthenaDance", rarity: "Epic", price: 800, templateId: "AthenaDance:eid_fresh" },
  { id: "eid_worm", name: "The Worm", type: "AthenaDance", rarity: "Rare", price: 500, templateId: "AthenaDance:eid_worm" },
  { id: "eid_takethel", name: "Take The L", type: "AthenaDance", rarity: "Rare", price: 500, templateId: "AthenaDance:eid_takethel" },
  { id: "eid_orangejustice", name: "Orange Justice", type: "AthenaDance", rarity: "Rare", price: 500, templateId: "AthenaDance:eid_orangejustice" },
  { id: "eid_electroshuffle", name: "Electro Shuffle", type: "AthenaDance", rarity: "Epic", price: 800, templateId: "AthenaDance:eid_electroshuffle" },
  { id: "pickaxe_id_starwand", name: "Star Wand", type: "AthenaPickaxe", rarity: "Rare", price: 800, templateId: "AthenaPickaxe:pickaxe_id_starwand" },
  { id: "pickaxe_id_reaper", name: "Reaper Pickaxe", type: "AthenaPickaxe", rarity: "Rare", price: 800, templateId: "AthenaPickaxe:pickaxe_id_reaper" },
  { id: "pickaxe_id_013_teslacoil", name: "AC/DC", type: "AthenaPickaxe", rarity: "Epic", price: 1200, templateId: "AthenaPickaxe:pickaxe_id_013_teslacoil" },
  { id: "glider_id_001_medieval", name: "Sir Glider", type: "AthenaGlider", rarity: "Uncommon", price: 500, templateId: "AthenaGlider:glider_id_001_medieval" },
  { id: "glider_id_014_dragon", name: "Frostwing", type: "AthenaGlider", rarity: "Legendary", price: 1500, templateId: "AthenaGlider:glider_id_014_dragon" },
  { id: "wrap_036_magma", name: "Magma Wrap", type: "AthenaItemWrap", rarity: "Epic", price: 700, templateId: "AthenaItemWrap:wrap_036_magma" },
  { id: "wrap_172_fusion", name: "Fusion Wrap", type: "AthenaItemWrap", rarity: "Rare", price: 500, templateId: "AthenaItemWrap:wrap_172_fusion" }
];

let currentDaily: ShopItem[] = [];
let currentFeatured: ShopItem[] = [];
let nextRotation: Date = new Date();

function getNextRotationTime(): Date {
  const now = new Date();
  const rotateTime = process.env.ROTATE_TIME || "00:00";
  const parts = rotateTime.split(":").map((v) => parseInt(v, 10));
  const hour = isNaN(parts[0]) ? 0 : parts[0];
  const minute = isNaN(parts[1]) ? 0 : parts[1];

  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);

  if (now.getTime() >= target.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target;
}

function calculatePrice(type: string, rarity: string): number {
  const r = rarity.toLowerCase();
  const t = type.toLowerCase();

  if (t.includes("character") || t.includes("outfit")) {
    if (r === "legendary") return 2000;
    if (r === "epic") return 1500;
    if (r === "rare") return 1200;
    return 800;
  }
  if (t.includes("pickaxe")) {
    if (r === "epic") return 1200;
    if (r === "rare") return 800;
    return 500;
  }
  if (t.includes("glider")) {
    if (r === "legendary") return 1500;
    if (r === "epic") return 1200;
    if (r === "rare") return 800;
    return 500;
  }
  if (t.includes("dance") || t.includes("emote")) {
    if (r === "epic") return 800;
    if (r === "rare") return 500;
    return 200;
  }
  if (t.includes("wrap")) {
    if (r === "epic") return 700;
    if (r === "rare") return 500;
    return 300;
  }
  return 500;
}

async function fetchOnlineCosmetics(): Promise<ShopItem[]> {
  try {
    const res = await fetch("https://fortnite-api.com/v2/cosmetics/br");
    if (!res.ok) return [];

    const json = (await res.json()) as any;
    const list = json.data || [];

    const parsed: ShopItem[] = [];
    for (const item of list) {
      const chapter = item.introduction?.chapter ? parseInt(item.introduction.chapter, 10) : 0;
      const typeVal = item.type?.value || "AthenaCharacter";
      const rarityVal = item.rarity?.displayValue || "Rare";

      if (chapter === 1 || chapter === 2) {
        let typeName = "AthenaCharacter";
        if (typeVal.toLowerCase().includes("emote")) typeName = "AthenaDance";
        if (typeVal.toLowerCase().includes("pickaxe")) typeName = "AthenaPickaxe";
        if (typeVal.toLowerCase().includes("glider")) typeName = "AthenaGlider";
        if (typeVal.toLowerCase().includes("wrap")) typeName = "AthenaItemWrap";
        if (typeVal.toLowerCase().includes("backpack")) typeName = "AthenaBackpack";

        parsed.push({
          id: item.id,
          name: item.name,
          type: typeName,
          rarity: rarityVal,
          price: calculatePrice(typeName, rarityVal),
          templateId: `${typeName}:${item.id.toLowerCase()}`
        });
      }
    }

    if (parsed.length > 10) return parsed;
  } catch (e) {}

  return [];
}

function pickRandomItems(pool: ShopItem[], count: number): ShopItem[] {
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export async function rotateShop(): Promise<{ daily: ShopItem[]; featured: ShopItem[] }> {
  const dailyCount = parseInt(process.env.DAILY_ITEMS_AMOUNT || "6", 10);
  const featuredCount = parseInt(process.env.FEATURED_ITEMS_AMOUNT || "2", 10);

  let pool = await fetchOnlineCosmetics();
  if (pool.length < (dailyCount + featuredCount)) {
    pool = FALLBACK_COSMETICS;
  }

  const selectedFeatured = pickRandomItems(pool.filter((i) => i.type === "AthenaCharacter" || i.price >= 1200), featuredCount);
  const remaining = pool.filter((i) => !selectedFeatured.some((f) => f.id === i.id));
  const selectedDaily = pickRandomItems(remaining, dailyCount);

  currentFeatured = selectedFeatured;
  currentDaily = selectedDaily;
  nextRotation = getNextRotationTime();

  logger.info(`Item shop rotated successfully (${currentFeatured.length} featured, ${currentDaily.length} daily).`);

  await sendShopNotification(currentDaily, currentFeatured, nextRotation);

  scheduleNextRotation();

  return { daily: currentDaily, featured: currentFeatured };
}

function scheduleNextRotation(): void {
  const msUntilNext = Math.max(1000, nextRotation.getTime() - Date.now());
  const minutes = Math.round(msUntilNext / 60000);
  logger.info(`Next Item Shop rotation scheduled in ${minutes} minutes.`);

  setTimeout(async () => {
    try {
      await rotateShop();
    } catch (e: any) {
      logger.error(`Error during shop rotation: ${e?.message || e}`);
    }
  }, msUntilNext);
}

export function getCurrentShop(): { daily: ShopItem[]; featured: ShopItem[]; nextRotation: Date } {
  if (currentDaily.length === 0 || currentFeatured.length === 0) {
    currentFeatured = pickRandomItems(FALLBACK_COSMETICS.filter((i) => i.price >= 1200), 2);
    currentDaily = pickRandomItems(FALLBACK_COSMETICS.filter((i) => !currentFeatured.some((f) => f.id === i.id)), 6);
    nextRotation = getNextRotationTime();
  }
  return { daily: currentDaily, featured: currentFeatured, nextRotation };
}

export function getStorefrontCatalog(): any {
  const shop = getCurrentShop();

  function formatEntries(items: ShopItem[], section: string): any[] {
    return items.map((item, index) => ({
      devName: `${section.toLowerCase()}_${item.id}`,
      offerId: `v2:/${section.toLowerCase()}_${item.id}`,
      fulfillmentIds: [],
      dailyLimit: -1,
      weeklyLimit: -1,
      monthlyLimit: -1,
      categories: ["Panel 01"],
      prices: [
        {
          currencyType: "MtxCurrency",
          currencySubType: "MtxPurchased",
          regularPrice: item.price,
          dynamicRegularPrice: item.price,
          finalPrice: item.price,
          basePrice: item.price
        }
      ],
      meta: {
        SectionId: section,
        TileSize: section === "Featured" ? "Normal" : "Small"
      },
      matchFilter: "",
      filterWeight: 0,
      appStoreId: "",
      requirements: [],
      offerType: "StaticPrice",
      giftInfo: {
        bIsEnabled: true,
        forcedGiftBoxTemplateId: "",
        purchaseRequirements: [],
        giftRecordIds: []
      },
      refundable: true,
      metaInfo: [],
      itemGrants: [
        {
          templateId: item.templateId,
          quantity: 1
        }
      ],
      sortPriority: index + 1,
      catalogGroupPriority: index + 1
    }));
  }

  return {
    refreshIntervalHrs: 24,
    dailyPurchaseHrs: 24,
    expiration: shop.nextRotation.toISOString(),
    storefronts: [
      {
        name: "BRDailyStorefront",
        catalogEntries: formatEntries(shop.daily, "Daily")
      },
      {
        name: "BRWeeklyStorefront",
        catalogEntries: formatEntries(shop.featured, "Featured")
      }
    ]
  };
}

export async function initShopRotation(): Promise<void> {
  const shouldAutoRotate = process.env.USE_AUTO_ROTATE !== "false";
  if (!shouldAutoRotate) return;

  await rotateShop();
}

export default {
  rotateShop,
  getCurrentShop,
  getStorefrontCatalog,
  initShopRotation
};
