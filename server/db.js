import 'dotenv/config';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'gcs';

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is required. Add it to .env locally and to the Vercel environment variables.');
}

const client = new MongoClient(MONGODB_URI);
let connectionPromise;
let indexesPromise;

async function users() {
  if (!connectionPromise) connectionPromise = client.connect();
  await connectionPromise;

  const collection = client.db(MONGODB_DB).collection('users');
  if (!indexesPromise) {
    indexesPromise = Promise.all([
      collection.createIndex({ email: 1 }, { unique: true }),
      collection.createIndex({ id: 1 }, { unique: true }),
    ]);
  }
  await indexesPromise;
  return collection;
}

async function nextUserId() {
  const collection = await users();
  const highestUser = await collection.find().sort({ id: -1 }).limit(1).next();
  const highestId = highestUser?.id || 0;
  const counter = await client.db(MONGODB_DB).collection('counters').findOneAndUpdate(
    { _id: 'users' },
    [
      {
        $set: {
          seq: {
            $add: [
              { $max: [{ $ifNull: ['$seq', highestId] }, highestId] },
              1,
            ],
          },
        },
      },
    ],
    { upsert: true, returnDocument: 'after', includeResultMetadata: false },
  );
  return counter.seq;
}

let reportLinksIndexesPromise;

async function reportLinks() {
  if (!connectionPromise) connectionPromise = client.connect();
  await connectionPromise;

  const collection = client.db(MONGODB_DB).collection('report_links');
  if (!reportLinksIndexesPromise) {
    reportLinksIndexesPromise = collection.createIndex({ id: 1 }, { unique: true });
  }
  await reportLinksIndexesPromise;
  return collection;
}

async function nextReportLinkId() {
  const collection = await reportLinks();
  const highestItem = await collection.find().sort({ id: -1 }).limit(1).next();
  const highestId = highestItem?.id || 0;
  const counter = await client.db(MONGODB_DB).collection('counters').findOneAndUpdate(
    { _id: 'report_links' },
    [
      {
        $set: {
          seq: {
            $add: [
              { $max: [{ $ifNull: ['$seq', highestId] }, highestId] },
              1,
            ],
          },
        },
      },
    ],
    { upsert: true, returnDocument: 'after', includeResultMetadata: false },
  );
  return counter.seq;
}

const db = {
  async getAllUsers() {
    return (await users()).find({}).sort({ id: 1 }).toArray();
  },

  async findByEmail(email) {
    return (await users()).findOne({ email: email.toLowerCase() });
  },

  async findById(id) {
    return (await users()).findOne({ id: Number(id) });
  },

  async createUser({ code_name, email, password, role = 'user', status = 'pending', is_default_owner = 0 }) {
    const user = {
      id: await nextUserId(),
      code_name,
      email: email.toLowerCase(),
      password,
      role,
      status,
      is_default_owner,
      created_at: new Date().toISOString(),
    };
    await (await users()).insertOne(user);
    return user;
  },

  async updateUser(id, updates) {
    return (await users()).findOneAndUpdate(
      { id: Number(id) },
      { $set: updates },
      { returnDocument: 'after', includeResultMetadata: false },
    );
  },

  async deleteUser(id) {
    const result = await (await users()).deleteOne({ id: Number(id) });
    return result.deletedCount === 1;
  },

  // ─── REPORT LINKS DB METHODS ──────────────────────
  async getAllReportLinks() {
    const col = await reportLinks();
    let links = await col.find({}).sort({ order: 1, created_at: -1 }).toArray();

    // Migration helper: ensure every document has a numeric 'order' field
    let needsMigration = false;
    links.forEach((item, index) => {
      if (typeof item.order !== 'number') {
        item.order = index;
        needsMigration = true;
      }
    });

    if (needsMigration) {
      const bulkOps = links.map((item, index) => ({
        updateOne: {
          filter: { id: Number(item.id) },
          update: { $set: { order: Number(index) } },
        },
      }));
      if (bulkOps.length > 0) {
        await col.bulkWrite(bulkOps);
      }
      links = await col.find({}).sort({ order: 1, created_at: -1 }).toArray();
    }

    return links;
  },

  async findReportLinkById(id) {
    return (await reportLinks()).findOne({ id: Number(id) });
  },

  async findSimilarReportLink({ name, link, excludeId }) {
    const col = await reportLinks();
    const all = await col.find({}).toArray();

    const normalizeUrl = (u) => {
      if (!u) return '';
      return u.toLowerCase().replace(/^https?:\/\//i, '').replace(/\/$/, '').trim();
    };

    const normName = name ? name.toLowerCase().trim() : '';
    const normLink = normalizeUrl(link);

    for (const item of all) {
      if (excludeId && Number(item.id) === Number(excludeId)) continue;

      const itemName = item.name ? item.name.toLowerCase().trim() : '';
      const itemLink = normalizeUrl(item.link);

      if (normName && itemName === normName) {
        return { type: 'name', match: item };
      }

      if (normLink && itemLink === normLink) {
        return { type: 'link', match: item };
      }
    }

    return null;
  },

  async createReportLink({ name, vpn, link, created_by, order }) {
    let linkOrder = order;
    if (linkOrder === undefined) {
      const highest = await (await reportLinks()).find({}).sort({ order: -1 }).limit(1).toArray();
      linkOrder = highest.length > 0 && typeof highest[0].order === 'number' ? highest[0].order + 1 : Date.now();
    }
    const item = {
      id: await nextReportLinkId(),
      name,
      vpn: vpn || 'None',
      link,
      order: linkOrder,
      created_by: created_by || 'Admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await (await reportLinks()).insertOne(item);
    return item;
  },

  async updateReportLink(id, updates) {
    return (await reportLinks()).findOneAndUpdate(
      { id: Number(id) },
      { $set: { ...updates, updated_at: new Date().toISOString() } },
      { returnDocument: 'after', includeResultMetadata: false },
    );
  },

  async reorderReportLinks(orderedIds) {
    const col = await reportLinks();
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { id: Number(id) },
        update: { $set: { order: index, updated_at: new Date().toISOString() } },
      },
    }));
    if (bulkOps.length > 0) {
      await col.bulkWrite(bulkOps);
    }
    return true;
  },

  async deleteReportLink(id) {
    const result = await (await reportLinks()).deleteOne({ id: Number(id) });
    return result.deletedCount === 1;
  },
};

export default db;

