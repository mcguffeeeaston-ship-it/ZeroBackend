import { getProfile, saveProfile } from "../utilites/database";
import logger from "../utilites/logger";

const DEFAULT_COSMETICS = [
  "AthenaCharacter:cid_683_athena_commando_f_harleyquinn",
  "AthenaCharacter:cid_647_athena_commando_m_heistpink",
  "AthenaCharacter:cid_671_athena_commando_f_pinkrose",
  "AthenaCharacter:cid_672_athena_commando_f_lovesong",
  "AthenaCharacter:cid_673_athena_commando_m_pinkheart",
  "AthenaCharacter:cid_562_athena_commando_m_darkagent",
  "AthenaCharacter:cid_560_athena_commando_m_eightball",
  "AthenaCharacter:cid_558_athena_commando_m_slurpmonster",
  "AthenaCharacter:cid_559_athena_commando_m_toxic",
  "AthenaCharacter:cid_557_athena_commando_f_medley",
  "AthenaCharacter:cid_556_athena_commando_m_seaturtle",
  "AthenaCharacter:cid_561_athena_commando_f_rose",
  "AthenaCharacter:cid_518_athena_commando_m_blackwidowrogue",
  "AthenaCharacter:cid_619_athena_commando_f_techopsblue",
  "AthenaCharacter:cid_590_athena_commando_m_slurpagent",
  "AthenaCharacter:cid_028_athena_commando_f",
  "AthenaCharacter:cid_035_athena_commando_m_medieval",
  "AthenaCharacter:cid_029_athena_commando_f_halloween",
  "AthenaCharacter:cid_030_athena_commando_m_halloween",
  "AthenaCharacter:cid_175_athena_commando_m_celestial",
  "AthenaCharacter:cid_313_athena_commando_m_kpopfashion",
  "AthenaCharacter:cid_441_athena_commando_f_cyberscavengerblue",
  "AthenaCharacter:cid_342_athena_commando_m_streetops",
  "AthenaCharacter:cid_116_athena_commando_m_carbideblack",
  "AthenaCharacter:cid_089_athena_commando_m_retrogrey",
  "AthenaCharacter:cid_113_athena_commando_m_artdeco",
  "AthenaCharacter:cid_017_athena_commando_m",
  "AthenaCharacter:cid_022_athena_commando_f",
  "AthenaDance:eid_floss",
  "AthenaDance:eid_worm",
  "AthenaDance:eid_takethel",
  "AthenaDance:eid_fresh",
  "AthenaDance:eid_kpopdance03",
  "AthenaDance:eid_orangejustice",
  "AthenaDance:eid_electroshuffle",
  "AthenaDance:eid_tidy",
  "AthenaDance:eid_starpower",
  "AthenaDance:eid_groovejam",
  "AthenaDance:eid_bhangra",
  "AthenaDance:eid_robot",
  "AthenaDance:eid_bestmates",
  "AthenaDance:eid_ridepony",
  "AthenaDance:eid_dance_default",
  "AthenaPickaxe:pickaxe_id_default",
  "AthenaPickaxe:pickaxe_lockjaw",
  "AthenaPickaxe:pickaxe_id_013_teslacoil",
  "AthenaPickaxe:pickaxe_id_015_holidaycandycane",
  "AthenaPickaxe:pickaxe_id_029_assassin",
  "AthenaPickaxe:pickaxe_id_077_carbidemtl",
  "AthenaPickaxe:pickaxe_id_starwand",
  "AthenaPickaxe:pickaxe_id_harleyquinnbaseballbat",
  "AthenaPickaxe:pickaxe_id_reaper",
  "AthenaGlider:glider_id_default",
  "AthenaGlider:glider_warthog",
  "AthenaGlider:glider_umbrella",
  "AthenaGlider:glider_umbrella_snowflake",
  "AthenaGlider:glider_id_001_medieval",
  "AthenaBackpack:bid_001_medieval",
  "AthenaBackpack:bid_002_medieval",
  "AthenaBackpack:bid_003_medieval",
  "AthenaBackpack:bid_103_galaxy",
  "AthenaBackpack:bid_138_celestial",
  "AthenaBackpack:bid_468_harleyquinn",
  "AthenaBackpack:bid_386_darkagent",
  "AthenaItemWrap:wrap_001_candycanes",
  "AthenaItemWrap:wrap_036_magma",
  "AthenaItemWrap:wrap_172_fusion",
  "AthenaMusicPack:musicpack_001_og",
  "AthenaMusicPack:musicpack_019_season11",
  "AthenaLoadingScreen:ls_season11_01"
];

export function createDefaultAthena(accountId: string): any {
  const items: Record<string, any> = {};

  items["cosmetic_locker"] = {
    templateId: "CosmeticLocker:cosmeticlocker_athena",
    attributes: {
      locker_slots_data: {
        slots: {
          Character: {
            items: ["AthenaCharacter:cid_562_athena_commando_m_darkagent"],
            activeVariants: []
          },
          Backpack: {
            items: ["AthenaBackpack:bid_386_darkagent"],
            activeVariants: []
          },
          Pickaxe: {
            items: ["AthenaPickaxe:pickaxe_id_default"],
            activeVariants: []
          },
          Glider: {
            items: ["AthenaGlider:glider_id_default"],
            activeVariants: []
          },
          ItemWrap: {
            items: [
              "AthenaItemWrap:wrap_172_fusion",
              "AthenaItemWrap:wrap_172_fusion",
              "AthenaItemWrap:wrap_172_fusion",
              "AthenaItemWrap:wrap_172_fusion",
              "AthenaItemWrap:wrap_172_fusion",
              "AthenaItemWrap:wrap_172_fusion",
              "AthenaItemWrap:wrap_172_fusion"
            ],
            activeVariants: []
          },
          MusicPack: {
            items: ["AthenaMusicPack:musicpack_019_season11"],
            activeVariants: []
          },
          LoadingScreen: {
            items: ["AthenaLoadingScreen:ls_season11_01"],
            activeVariants: []
          },
          Dance: {
            items: [
              "AthenaDance:eid_floss",
              "AthenaDance:eid_worm",
              "AthenaDance:eid_takethel",
              "AthenaDance:eid_dance_default",
              "",
              ""
            ],
            activeVariants: []
          }
        }
      },
      use_count: 0,
      banner_icon_template: "StandardBanner1",
      banner_color_template: "DefaultColor1",
      locker_name: "ZeroLocker",
      item_seen: false,
      favorite: false
    },
    quantity: 1
  };

  for (const cosmetic of DEFAULT_COSMETICS) {
    items[cosmetic] = {
      templateId: cosmetic,
      attributes: {
        max_level_bonus: 0,
        level: 1,
        item_seen: true,
        xp: 0,
        variants: [],
        favorite: false
      },
      quantity: 1
    };
  }

  const now = new Date().toISOString();
  return {
    _id: accountId,
    created: now,
    updated: now,
    rvn: 1,
    wipeNumber: 1,
    accountId,
    profileId: "athena",
    version: "zero_11.50",
    items,
    stats: {
      attributes: {
        season_match_boost: 999,
        loadouts: ["cosmetic_locker"],
        rested_xp_overflow: 0,
        mfa_reward_claimed: true,
        quest_manager: {
          dailyLoginInterval: now,
          dailyQuestRerolls: 1
        },
        book_level: 100,
        season_num: 11,
        season_update: 1,
        book_xp: 0,
        permissions: [],
        book_purchased: true,
        lifetime_wins: 42,
        party_assist_quest: "",
        purchased_battle_pass_tier_offers: {},
        rested_xp_exchange: 1,
        level: 100,
        rested_xp: 0,
        rested_xp_mult: 4.4,
        accountLevel: 100,
        competitive_past_seasons: [],
        season: {
          numWins: 42,
          numHighBracket: 15,
          numLowBracket: 20
        },
        favorite_musicpack: "AthenaMusicPack:musicpack_019_season11",
        favorite_glider: "AthenaGlider:glider_id_default",
        favorite_pickaxe: "AthenaPickaxe:pickaxe_id_default",
        favorite_character: "AthenaCharacter:cid_562_athena_commando_m_darkagent",
        favorite_backpack: "AthenaBackpack:bid_386_darkagent",
        favorite_itemwraps: [
          "AthenaItemWrap:wrap_172_fusion",
          "AthenaItemWrap:wrap_172_fusion",
          "AthenaItemWrap:wrap_172_fusion",
          "AthenaItemWrap:wrap_172_fusion",
          "AthenaItemWrap:wrap_172_fusion",
          "AthenaItemWrap:wrap_172_fusion",
          "AthenaItemWrap:wrap_172_fusion"
        ],
        favorite_loadingscreen: "AthenaLoadingScreen:ls_season11_01",
        favorite_dance: [
          "AthenaDance:eid_floss",
          "AthenaDance:eid_worm",
          "AthenaDance:eid_takethel",
          "AthenaDance:eid_dance_default",
          "",
          ""
        ]
      }
    },
    commandRevision: 1
  };
}

export function createDefaultCommonCore(accountId: string): any {
  const now = new Date().toISOString();
  return {
    _id: accountId,
    created: now,
    updated: now,
    rvn: 1,
    wipeNumber: 1,
    accountId,
    profileId: "common_core",
    version: "zero_11.50",
    items: {
      "Currency:MtxPurchased": {
        templateId: "Currency:MtxPurchased",
        attributes: { platform: "EpicPC" },
        quantity: 100000
      },
      "Token:MtxToken": {
        templateId: "Token:MtxToken",
        attributes: { platform: "EpicPC" },
        quantity: 100000
      },
      "Token:AthenaRefundToken": {
        templateId: "Token:AthenaRefundToken",
        attributes: {},
        quantity: 3
      }
    },
    stats: {
      attributes: {
        survey_data: {},
        personal_offers: [],
        intro_game_played: true,
        import_friends_claimed: {},
        mtx_affiliate: "ZeroBackend",
        undo_cooldowns: [],
        mtx_affiliate_set_time: now,
        inventory_limit_bonus: 0,
        current_mtx_platform: "EpicPC",
        mtx_platform: "EpicPC",
        weekly_purchases: {},
        daily_purchases: {},
        ban_status: {},
        in_app_purchases: {},
        permissions: [],
        undo_tokens: 3,
        monthly_purchases: {},
        gift_history: {},
        allowed_to_send_gifts: true,
        mfa_enabled: true,
        allowed_to_receive_gifts: true
      }
    },
    commandRevision: 1
  };
}

export function createDefaultCampaign(accountId: string): any {
  const now = new Date().toISOString();
  return {
    _id: accountId,
    created: now,
    updated: now,
    rvn: 1,
    wipeNumber: 1,
    accountId,
    profileId: "campaign",
    version: "zero_11.50",
    items: {
      "Token:helixbackend": {
        templateId: "Token:helixbackend",
        attributes: { item_seen: true },
        quantity: 1
      },
      "Quest:stonewoodquest_joelkarolina_savesurvivors": {
        templateId: "Quest:stonewoodquest_joelkarolina_savesurvivors",
        attributes: {
          completion_stonewoodquest_joelkarolina_savesurvivors: 100,
          level: -1,
          item_seen: true,
          quest_state: "Claimed",
          xp: 0,
          favorite: false
        },
        quantity: 1
      }
    },
    stats: {
      attributes: {
        inventory_limit_bonus: 0,
        unreal_purchased: true,
        founder_packs: ["FounderPack_Standard"],
        legacy_research_points_spent: 0
      }
    },
    commandRevision: 1
  };
}

export function createDefaultCreative(accountId: string): any {
  const now = new Date().toISOString();
  return {
    _id: accountId,
    created: now,
    updated: now,
    rvn: 1,
    wipeNumber: 1,
    accountId,
    profileId: "creative",
    version: "zero_11.50",
    items: {
      "Token:helixbackend": {
        templateId: "Token:helixbackend",
        attributes: { item_seen: true },
        quantity: 1
      }
    },
    stats: {
      attributes: {
        inventory_limit_bonus: 0
      }
    },
    commandRevision: 1
  };
}

export async function getOrCreateProfile(accountId: string, profileId: string): Promise<any> {
  let profile = await getProfile(accountId, profileId);
  if (!profile) {
    if (profileId === "athena") {
      profile = createDefaultAthena(accountId);
    } else if (profileId === "common_core") {
      profile = createDefaultCommonCore(accountId);
    } else if (profileId === "campaign") {
      profile = createDefaultCampaign(accountId);
    } else if (profileId === "creative") {
      profile = createDefaultCreative(accountId);
    } else {
      profile = {
        _id: accountId,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        rvn: 1,
        wipeNumber: 1,
        accountId,
        profileId,
        version: "zero_11.50",
        items: {},
        stats: { attributes: {} },
        commandRevision: 1
      };
    }
    await saveProfile(accountId, profileId, profile);
    logger.info(`Initialized default profile '${profileId}' for ${accountId}`);
  }
  return profile;
}

export async function handleClientQuestLogin(
  accountId: string,
  profileId: string,
  payload: any
): Promise<any> {
  const profile = await getOrCreateProfile(accountId, profileId);

  profile.rvn = (profile.rvn || 0) + 1;
  profile.commandRevision = (profile.commandRevision || 0) + 1;
  profile.updated = new Date().toISOString();

  const profileChanges = [
    {
      changeType: "fullProfileUpdate",
      profile
    }
  ];

  await saveProfile(accountId, profileId, profile);

  return {
    profileRevision: profile.rvn,
    profileId: profile.profileId,
    profileChangesBaseRevision: profile.rvn - 1,
    profileChanges,
    profileCommandRevision: profile.commandRevision,
    serverTime: new Date().toISOString(),
    responseVersion: 1
  };
}

export async function handleMcpOperation(
  accountId: string,
  profileId: string,
  operation: string,
  payload: any
): Promise<any> {
  if (operation === "ClientQuestLogin") {
    return handleClientQuestLogin(accountId, profileId, payload);
  }

  const profile = await getOrCreateProfile(accountId, profileId);
  const profileChanges: any[] = [];
  let saveNeeded = false;

  if (operation === "QueryProfile") {
    profileChanges.push({
      changeType: "fullProfileUpdate",
      profile
    });
  } else if (operation === "EquipBattleRoyaleCustomization") {
    const slotName = payload.slotName;
    const itemToSlot = payload.itemToSlot;
    const indexWithinSlot = payload.indexWithinSlot || 0;

    if (slotName && profile.items && profile.items["cosmetic_locker"]) {
      const locker = profile.items["cosmetic_locker"];
      if (locker.attributes?.locker_slots_data?.slots?.[slotName]) {
        locker.attributes.locker_slots_data.slots[slotName].items[indexWithinSlot] = itemToSlot;
        profile.rvn = (profile.rvn || 0) + 1;
        saveNeeded = true;
        profileChanges.push({
          changeType: "itemAttrChanged",
          itemId: "cosmetic_locker",
          attributeName: "locker_slots_data",
          attributeValue: locker.attributes.locker_slots_data
        });
      }
    }
  } else if (operation === "SetCosmeticLockerSlot") {
    const category = payload.category;
    const itemToSlot = payload.itemToSlot;
    const slotIndex = payload.slotIndex || 0;

    if (category && profile.items && profile.items["cosmetic_locker"]) {
      const locker = profile.items["cosmetic_locker"];
      if (locker.attributes?.locker_slots_data?.slots?.[category]) {
        locker.attributes.locker_slots_data.slots[category].items[slotIndex] = itemToSlot;
        profile.rvn = (profile.rvn || 0) + 1;
        saveNeeded = true;
        profileChanges.push({
          changeType: "itemAttrChanged",
          itemId: "cosmetic_locker",
          attributeName: "locker_slots_data",
          attributeValue: locker.attributes.locker_slots_data
        });
      }
    }
  } else if (operation === "SetCosmeticLockerBanner") {
    if (profile.items && profile.items["cosmetic_locker"]) {
      const locker = profile.items["cosmetic_locker"];
      if (payload.bannerIconTemplateName) {
        locker.attributes.banner_icon_template = payload.bannerIconTemplateName;
      }
      if (payload.bannerColorTemplateName) {
        locker.attributes.banner_color_template = payload.bannerColorTemplateName;
      }
      profile.rvn = (profile.rvn || 0) + 1;
      saveNeeded = true;
      profileChanges.push({
        changeType: "itemAttrChanged",
        itemId: "cosmetic_locker",
        attributeName: "banner_icon_template",
        attributeValue: locker.attributes.banner_icon_template
      });
    }
  } else if (operation === "SetMtxPlatform") {
    if (profile.stats?.attributes) {
      profile.stats.attributes.current_mtx_platform = payload.platform || "EpicPC";
      profile.rvn = (profile.rvn || 0) + 1;
      saveNeeded = true;
      profileChanges.push({
        changeType: "statModified",
        name: "current_mtx_platform",
        value: profile.stats.attributes.current_mtx_platform
      });
    }
  } else if (operation === "SetAffiliateName") {
    if (profile.stats?.attributes) {
      profile.stats.attributes.mtx_affiliate = payload.affiliateName || "ZeroBackend";
      profile.stats.attributes.mtx_affiliate_set_time = new Date().toISOString();
      profile.rvn = (profile.rvn || 0) + 1;
      saveNeeded = true;
      profileChanges.push(
        {
          changeType: "statModified",
          name: "mtx_affiliate",
          value: profile.stats.attributes.mtx_affiliate
        },
        {
          changeType: "statModified",
          name: "mtx_affiliate_set_time",
          value: profile.stats.attributes.mtx_affiliate_set_time
        }
      );
    }
  } else if (operation === "PurchaseCatalogEntry") {
    const offerId = payload.offerId || "";
    const purchaseQuantity = payload.purchaseQuantity || 1;
    profile.rvn = (profile.rvn || 0) + 1;
    saveNeeded = true;
    profileChanges.push({
      changeType: "fullProfileUpdate",
      profile
    });
  } else if (operation === "PurchaseBattlePassTierOffers") {
    const tierCount = payload.tierCount || 1;
    if (profile.stats?.attributes) {
      profile.stats.attributes.book_level = Math.min(100, (profile.stats.attributes.book_level || 1) + tierCount);
      profile.rvn = (profile.rvn || 0) + 1;
      saveNeeded = true;
      profileChanges.push({
        changeType: "statModified",
        name: "book_level",
        value: profile.stats.attributes.book_level
      });
    }
  } else if (operation === "GiftCatalogEntry") {
    const receiverId = payload.receiverId || "";
    if (profile.stats?.attributes) {
      if (!profile.stats.attributes.gift_history) profile.stats.attributes.gift_history = {};
      profile.stats.attributes.gift_history[receiverId] = {
        time: new Date().toISOString(),
        offerId: payload.offerId || ""
      };
      profile.rvn = (profile.rvn || 0) + 1;
      saveNeeded = true;
      profileChanges.push({
        changeType: "statModified",
        name: "gift_history",
        value: profile.stats.attributes.gift_history
      });
    }
  } else if (operation === "ClaimMfaEnabled") {
    if (profile.stats?.attributes) {
      profile.stats.attributes.mfa_enabled = true;
      profile.rvn = (profile.rvn || 0) + 1;
      saveNeeded = true;
      profileChanges.push({
        changeType: "statModified",
        name: "mfa_enabled",
        value: true
      });
    }
  } else {
    profileChanges.push({
      changeType: "fullProfileUpdate",
      profile
    });
  }

  if (saveNeeded) {
    profile.commandRevision = (profile.commandRevision || 0) + 1;
    profile.updated = new Date().toISOString();
    await saveProfile(accountId, profileId, profile);
  }

  return {
    profileRevision: profile.rvn,
    profileId: profile.profileId,
    profileChangesBaseRevision: profile.rvn - 1,
    profileChanges,
    profileCommandRevision: profile.commandRevision,
    serverTime: new Date().toISOString(),
    responseVersion: 1
  };
}

export default handleClientQuestLogin;
