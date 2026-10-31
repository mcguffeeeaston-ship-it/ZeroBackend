import mongoose, { Schema, Document } from "mongoose";
import dotenv from "dotenv";
import logger from "./logger";
import crypto from "crypto";

dotenv.config();

const mongourl: string = process.env.MONGODB || "mongodb://127.0.0.1:27017/zerobackend";

export interface IUser extends Document {
  accountId: string;
  username: string;
  email: string;
  password?: string;
  discordId?: string;
  discordUsername?: string;
  banned: boolean;
  created: string;
  lastLogin: string;
}

const UserSchema = new Schema<IUser>({
  accountId: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true, index: true },
  email: { type: String, required: true, lowercase: true, index: true },
  password: { type: String },
  discordId: { type: String, sparse: true, index: true },
  discordUsername: { type: String },
  banned: { type: Boolean, default: false },
  created: { type: String, default: () => new Date().toISOString() },
  lastLogin: { type: String, default: () => new Date().toISOString() }
});

export const UserModel = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export interface IProfile extends Document {
  accountId: string;
  profileId: string;
  rvn: number;
  commandRevision: number;
  items: Record<string, any>;
  stats: {
    attributes: Record<string, any>;
  };
  created: string;
  updated: string;
}

const ProfileSchema = new Schema<IProfile>({
  accountId: { type: String, required: true, index: true },
  profileId: { type: String, required: true, index: true },
  rvn: { type: Number, default: 1 },
  commandRevision: { type: Number, default: 1 },
  items: { type: Schema.Types.Mixed, default: {} },
  stats: {
    attributes: { type: Schema.Types.Mixed, default: {} }
  },
  created: { type: String, default: () => new Date().toISOString() },
  updated: { type: String, default: () => new Date().toISOString() }
});

ProfileSchema.index({ accountId: 1, profileId: 1 }, { unique: true });

export const ProfileModel = mongoose.models.Profile || mongoose.model<IProfile>("Profile", ProfileSchema);

export interface ICloudFile extends Document {
  accountId: string;
  filename: string;
  data: string;
  length: number;
  hash: string;
  hash256: string;
  updatedAt: string;
}

const CloudFileSchema = new Schema<ICloudFile>({
  accountId: { type: String, required: true, index: true },
  filename: { type: String, required: true, index: true },
  data: { type: String, default: "" },
  length: { type: Number, default: 0 },
  hash: { type: String, default: "" },
  hash256: { type: String, default: "" },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

CloudFileSchema.index({ accountId: 1, filename: 1 }, { unique: true });

export const CloudFileModel = mongoose.models.CloudFile || mongoose.model<ICloudFile>("CloudFile", CloudFileSchema);

export interface IStats extends Document {
  accountId: string;
  hype: number;
  division: number;
  solo: Record<string, number>;
  duo: Record<string, number>;
  squad: Record<string, number>;
  ltm: Record<string, number>;
}

const StatsSchema = new Schema<IStats>({
  accountId: { type: String, required: true, unique: true, index: true },
  hype: { type: Number, default: 0 },
  division: { type: Number, default: 1 },
  solo: { type: Schema.Types.Mixed, default: { kills: 0, wins: 0, placetop1: 0, placetop10: 0, placetop25: 0, matchesplayed: 0, score: 0, minutesplayed: 0, playersoutlived: 0 } },
  duo: { type: Schema.Types.Mixed, default: { kills: 0, wins: 0, placetop1: 0, placetop5: 0, placetop12: 0, matchesplayed: 0, score: 0, minutesplayed: 0, playersoutlived: 0 } },
  squad: { type: Schema.Types.Mixed, default: { kills: 0, wins: 0, placetop1: 0, placetop3: 0, placetop6: 0, matchesplayed: 0, score: 0, minutesplayed: 0, playersoutlived: 0 } },
  ltm: { type: Schema.Types.Mixed, default: { kills: 0, wins: 0, matchesplayed: 0, score: 0, minutesplayed: 0, playersoutlived: 0 } }
});

export const StatsModel = mongoose.models.Stats || mongoose.model<IStats>("Stats", StatsSchema);

export interface IFriends extends Document {
  accountId: string;
  list: {
    accepted: Array<{ accountId: string; created: string; alias?: string }>;
    incoming: Array<{ accountId: string; created: string }>;
    outgoing: Array<{ accountId: string; created: string }>;
    blocked: Array<{ accountId: string; created: string }>;
  };
}

const FriendsSchema = new Schema<IFriends>({
  accountId: { type: String, required: true, unique: true, index: true },
  list: {
    accepted: { type: Array, default: [] },
    incoming: { type: Array, default: [] },
    outgoing: { type: Array, default: [] },
    blocked: { type: Array, default: [] }
  }
});

export const FriendsModel = mongoose.models.Friends || mongoose.model<IFriends>("Friends", FriendsSchema);

export interface ISACCode extends Document {
  code: string;
  code_lower: string;
  code_higher: string;
  ownerAccountId: string;
  created: string;
}

const SACCodeSchema = new Schema<ISACCode>({
  code: { type: String, required: true, unique: true, index: true },
  code_lower: { type: String, required: true, index: true },
  code_higher: { type: String, required: true },
  ownerAccountId: { type: String, default: "" },
  created: { type: String, default: () => new Date().toISOString() }
});

export const SACCodeModel = mongoose.models.SACCode || mongoose.model<ISACCode>("SACCode", SACCodeSchema);

const usersMemory = new Map<string, any>();
const profilesMemory = new Map<string, any>();
const cloudFilesMemory = new Map<string, { buffer: Buffer; updatedAt: string }>();
const statsMemory = new Map<string, any>();
const friendsMemory = new Map<string, any>();
const sacMemory = new Map<string, any>();

let isConnected = false;

export async function ConnectDatabase(): Promise<void> {
  try {
    await mongoose.connect(mongourl, {
      serverSelectionTimeoutMS: 4000
    });
    isConnected = true;
    logger.info("Successfully connected to your database.");
  } catch (error) {
    isConnected = false;
    logger.warn(`Could not connect to MongoDB (${mongourl}). Running in memory fallback mode.`);
  }
}

export function generateUUID(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function sha1(data: string | Buffer): string {
  const binary: crypto.BinaryLike = typeof data === "string" ? data : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  return crypto.createHash("sha1").update(binary).digest("hex");
}

export function sha256(data: string | Buffer): string {
  const binary: crypto.BinaryLike = typeof data === "string" ? data : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  return crypto.createHash("sha256").update(binary).digest("hex");
}

export async function findOrCreateUser(usernameOrEmail: string): Promise<any> {
  const clean = usernameOrEmail.trim();
  const lower = clean.toLowerCase();
  const username = clean.includes("@") ? clean.split("@")[0] : clean;
  const email = clean.includes("@") ? lower : `${lower}@zero.local`;

  if (isConnected) {
    try {
      let user = await UserModel.findOne({
        $or: [{ email }, { username: new RegExp(`^${clean}$`, "i") }]
      });

      if (!user) {
        user = await UserModel.create({
          accountId: generateUUID(),
          username,
          email,
          created: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
      } else {
        user.lastLogin = new Date().toISOString();
        await user.save();
      }
      return user.toObject();
    } catch (e) {}
  }

  for (const u of usersMemory.values()) {
    if (u.email.toLowerCase() === email || u.username.toLowerCase() === username.toLowerCase()) {
      u.lastLogin = new Date().toISOString();
      return u;
    }
  }

  const accountId = generateUUID();
  const newUser = {
    accountId,
    username,
    email,
    banned: false,
    created: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };
  usersMemory.set(accountId, newUser);
  return newUser;
}

export async function getUserById(accountId: string): Promise<any | null> {
  if (isConnected) {
    try {
      const user = await UserModel.findOne({ accountId });
      if (user) return user.toObject();
    } catch (e) {}
  }
  return usersMemory.get(accountId) || null;
}

export async function getUserByUsername(username: string): Promise<any | null> {
  if (isConnected) {
    try {
      const user = await UserModel.findOne({ username: new RegExp(`^${username}$`, "i") });
      if (user) return user.toObject();
    } catch (e) {}
  }
  for (const u of usersMemory.values()) {
    if (u.username.toLowerCase() === username.toLowerCase()) return u;
  }
  return null;
}

export async function getUserByDiscordId(discordId: string): Promise<any | null> {
  if (isConnected) {
    try {
      const user = await UserModel.findOne({ discordId });
      if (user) return user.toObject();
    } catch (e) {}
  }
  for (const u of usersMemory.values()) {
    if (u.discordId === discordId) return u;
  }
  return null;
}

export async function saveUser(userData: any): Promise<void> {
  usersMemory.set(userData.accountId, userData);
  if (isConnected) {
    try {
      await UserModel.findOneAndUpdate(
        { accountId: userData.accountId },
        userData,
        { upsert: true }
      );
    } catch (e) {}
  }
}

export async function getProfile(accountId: string, profileId: string): Promise<any | null> {
  const key = `${accountId}_${profileId}`;
  if (isConnected) {
    try {
      const doc = await ProfileModel.findOne({ accountId, profileId });
      if (doc) return doc.toObject();
    } catch (e) {}
  }
  return profilesMemory.get(key) || null;
}

export async function saveProfile(accountId: string, profileId: string, profileData: any): Promise<void> {
  const key = `${accountId}_${profileId}`;
  profilesMemory.set(key, profileData);
  if (isConnected) {
    try {
      await ProfileModel.findOneAndUpdate(
        { accountId, profileId },
        profileData,
        { upsert: true }
      );
    } catch (e) {}
  }
}

export async function getUserCloudFile(accountId: string, filename: string): Promise<Buffer | null> {
  const key = `${accountId}_${filename}`;
  if (isConnected) {
    try {
      const doc = await CloudFileModel.findOne({ accountId, filename });
      if (doc && doc.data) {
        return Buffer.from(doc.data, "base64");
      }
    } catch (e) {}
  }

  const memoryFile = cloudFilesMemory.get(key);
  return memoryFile ? memoryFile.buffer : null;
}

export async function saveUserCloudFile(accountId: string, filename: string, buffer: Buffer): Promise<void> {
  const key = `${accountId}_${filename}`;
  const now = new Date().toISOString();
  cloudFilesMemory.set(key, { buffer, updatedAt: now });

  if (isConnected) {
    try {
      await CloudFileModel.findOneAndUpdate(
        { accountId, filename },
        {
          accountId,
          filename,
          data: buffer.toString("base64"),
          length: buffer.length,
          hash: sha1(buffer),
          hash256: sha256(buffer),
          updatedAt: now
        },
        { upsert: true }
      );
    } catch (e) {}
  }
}

export async function listUserCloudFiles(accountId: string): Promise<any[]> {
  const files: any[] = [];
  const trackedNames = new Set<string>();

  if (isConnected) {
    try {
      const docs = await CloudFileModel.find({ accountId });
      for (const d of docs) {
        files.push({
          uniqueFilename: d.filename,
          filename: d.filename,
          hash: d.hash,
          hash256: d.hash256,
          length: d.length,
          contentType: "application/octet-stream",
          uploaded: d.updatedAt,
          storageType: "S3",
          doNotCache: false
        });
        trackedNames.add(d.filename);
      }
    } catch (e) {}
  }

  for (const [key, val] of cloudFilesMemory.entries()) {
    if (key.startsWith(`${accountId}_`)) {
      const filename = key.replace(`${accountId}_`, "");
      if (!trackedNames.has(filename)) {
        files.push({
          uniqueFilename: filename,
          filename,
          hash: sha1(val.buffer),
          hash256: sha256(val.buffer),
          length: val.buffer.length,
          contentType: "application/octet-stream",
          uploaded: val.updatedAt,
          storageType: "S3",
          doNotCache: false
        });
      }
    }
  }

  return files;
}

export async function getStats(accountId: string): Promise<any> {
  if (isConnected) {
    try {
      const doc = await StatsModel.findOne({ accountId });
      if (doc) return doc.toObject();
    } catch (e) {}
  }
  let s = statsMemory.get(accountId);
  if (!s) {
    s = {
      accountId,
      hype: 0,
      division: 1,
      solo: { kills: 0, wins: 0, placetop1: 0, placetop10: 0, placetop25: 0, matchesplayed: 0, score: 0, minutesplayed: 0, playersoutlived: 0 },
      duo: { kills: 0, wins: 0, placetop1: 0, placetop5: 0, placetop12: 0, matchesplayed: 0, score: 0, minutesplayed: 0, playersoutlived: 0 },
      squad: { kills: 0, wins: 0, placetop1: 0, placetop3: 0, placetop6: 0, matchesplayed: 0, score: 0, minutesplayed: 0, playersoutlived: 0 },
      ltm: { kills: 0, wins: 0, matchesplayed: 0, score: 0, minutesplayed: 0, playersoutlived: 0 }
    };
    statsMemory.set(accountId, s);
  }
  return s;
}

export async function saveStats(accountId: string, statsData: any): Promise<void> {
  statsMemory.set(accountId, statsData);
  if (isConnected) {
    try {
      await StatsModel.findOneAndUpdate({ accountId }, statsData, { upsert: true });
    } catch (e) {}
  }
}

export async function getAllStats(): Promise<any[]> {
  if (isConnected) {
    try {
      const docs = await StatsModel.find({});
      if (docs && docs.length > 0) return docs.map((d) => d.toObject());
    } catch (e) {}
  }
  return Array.from(statsMemory.values());
}

export async function getFriends(accountId: string): Promise<any> {
  if (isConnected) {
    try {
      const doc = await FriendsModel.findOne({ accountId });
      if (doc) return doc.toObject();
    } catch (e) {}
  }
  let f = friendsMemory.get(accountId);
  if (!f) {
    f = {
      accountId,
      list: { accepted: [], incoming: [], outgoing: [], blocked: [] }
    };
    friendsMemory.set(accountId, f);
  }
  return f;
}

export async function saveFriends(accountId: string, friendsData: any): Promise<void> {
  friendsMemory.set(accountId, friendsData);
  if (isConnected) {
    try {
      await FriendsModel.findOneAndUpdate({ accountId }, friendsData, { upsert: true });
    } catch (e) {}
  }
}

export async function getSACCode(slug: string): Promise<any | null> {
  const lower = slug.toLowerCase();
  if (isConnected) {
    try {
      const doc = await SACCodeModel.findOne({ code_lower: lower });
      if (doc) return doc.toObject();
    } catch (e) {}
  }
  return sacMemory.get(lower) || null;
}

export async function saveSACCode(code: string, ownerAccountId: string = ""): Promise<void> {
  const data = {
    code,
    code_lower: code.toLowerCase(),
    code_higher: code.toUpperCase(),
    ownerAccountId,
    created: new Date().toISOString()
  };
  sacMemory.set(code.toLowerCase(), data);
  if (isConnected) {
    try {
      await SACCodeModel.findOneAndUpdate({ code_lower: code.toLowerCase() }, data, { upsert: true });
    } catch (e) {}
  }
}

export default ConnectDatabase;
