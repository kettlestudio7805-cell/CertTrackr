import { type Certificate, type InsertCertificate, type UpdateCertificate, type SearchCertificatesParams, certificates, type Subscription, type InsertSubscription, type UpdateSubscription, subscriptions } from "@shared/schema";
import { db } from "../db";
import { eq, sql, and, or, ilike } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Certificate operations
  getCertificate(id: string): Promise<Certificate | undefined>;
  getCertificates(params?: SearchCertificatesParams): Promise<Certificate[]>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  updateCertificate(id: string, updates: UpdateCertificate): Promise<Certificate | undefined>;
  deleteCertificate(id: string): Promise<boolean>;
  searchCertificates(query: string): Promise<Certificate[]>;
  
  // Subscription operations
  getSubscription(id: string): Promise<Subscription | undefined>;
  getSubscriptions(): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, updates: UpdateSubscription): Promise<Subscription | undefined>;
  deleteSubscription(id: string): Promise<boolean>;
  
  // Statistics
  getCertificateStats(): Promise<{
    total: number;
    valid: number;
    expiring: number;
    expired: number;
  }>;
  
  getSubscriptionStats(): Promise<{
    total: number;
    valid: number;
    expiring: number;
    expired: number;
  }>;
}

export class PostgreSQLStorage implements IStorage {
  private calculateDaysUntilExpiry(expiryDate: Date): number {
    const now = new Date();
    const timeDiff = expiryDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  private isExpired(expiryDate: Date): boolean {
    return new Date() > expiryDate;
  }

  private enrichCertificate(cert: typeof certificates.$inferSelect): Certificate {
    const expiryDate = new Date(cert.expiryDate);
    return {
      ...cert,
      isExpired: this.isExpired(expiryDate),
      daysUntilExpiry: this.calculateDaysUntilExpiry(expiryDate),
    } as Certificate;
  }

  async getCertificate(id: string): Promise<Certificate | undefined> {
    const result = await db.select().from(certificates).where(eq(certificates.id, id)).limit(1);
    return result.length > 0 ? this.enrichCertificate(result[0]) : undefined;
  }

  async getCertificates(params?: SearchCertificatesParams): Promise<Certificate[]> {
    let query = db.select().from(certificates);
    
    // Add WHERE clause for status filtering
    if (params?.status && params.status !== "all") {
      const now = sql`now()`;
      switch (params.status) {
        case "expired":
          query = query.where(sql`${certificates.expiryDate} < ${now}`);
          break;
        case "expiring":
          query = query.where(
            and(
              sql`${certificates.expiryDate} >= ${now}`,
              sql`${certificates.expiryDate} <= ${now} + interval '30 days'`
            )
          );
          break;
        case "valid":
          query = query.where(sql`${certificates.expiryDate} > ${now} + interval '30 days'`);
          break;
      }
    }

    // Order by expiry date (expired first, then by expiry date)
    query = query.orderBy(certificates.expiryDate);
    
    // Apply pagination
    if (params?.offset) {
      query = query.offset(params.offset);
    }
    if (params?.limit) {
      query = query.limit(params.limit);
    }
    
    const results = await query;
    return results.map(cert => this.enrichCertificate(cert));
  }

  async createCertificate(insertCertificate: InsertCertificate): Promise<Certificate> {
    const [result] = await db.insert(certificates).values(insertCertificate).returning();
    return this.enrichCertificate(result);
  }

  async updateCertificate(id: string, updates: UpdateCertificate): Promise<Certificate | undefined> {
    const [result] = await db.update(certificates)
      .set(updates)
      .where(eq(certificates.id, id))
      .returning();
    
    return result ? this.enrichCertificate(result) : undefined;
  }

  async deleteCertificate(id: string): Promise<boolean> {
    const deleted = await db
      .delete(certificates)
      .where(eq(certificates.id, id))
      .returning({ id: certificates.id });
    return deleted.length > 0;
  }

  async searchCertificates(query: string): Promise<Certificate[]> {
    if (!query.trim()) return this.getCertificates();

    const searchTerm = `%${query}%`;
    const results = await db.select().from(certificates)
      .where(
        or(
          ilike(certificates.name, searchTerm),
          ilike(certificates.issuer, searchTerm),
          ilike(certificates.ocrText, searchTerm),
          ilike(certificates.fileName, searchTerm)
        )
      )
      .orderBy(certificates.expiryDate);

    return results.map(cert => this.enrichCertificate(cert));
  }

  async getCertificateStats(): Promise<{
    total: number;
    valid: number;
    expiring: number;
    expired: number;
  }> {
    const now = sql`now()`;
    
    const [stats] = await db.select({
      total: sql<number>`count(*)::int`,
      expired: sql<number>`count(*) filter (where ${certificates.expiryDate} < ${now})::int`,
      expiring: sql<number>`count(*) filter (where ${certificates.expiryDate} >= ${now} and ${certificates.expiryDate} <= ${now} + interval '30 days')::int`,
      valid: sql<number>`count(*) filter (where ${certificates.expiryDate} > ${now} + interval '30 days')::int`
    }).from(certificates);

    return stats;
  }

  async getSubscription(id: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
    return result.length > 0 ? this.enrichSubscription(result[0]) : undefined;
  }

  async getSubscriptions(): Promise<Subscription[]> {
    const results = await db.select().from(subscriptions);
    return results.map(sub => this.enrichSubscription(sub));
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [result] = await db.insert(subscriptions).values(insertSubscription).returning();
    return this.enrichSubscription(result);
  }

  async updateSubscription(id: string, updates: UpdateSubscription): Promise<Subscription | undefined> {
    const [result] = await db.update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.id, id))
      .returning();
    
    return result ? this.enrichSubscription(result) : undefined;
  }

  async deleteSubscription(id: string): Promise<boolean> {
    await db.delete(subscriptions).where(eq(subscriptions.id, id));
    return true;
  }

  private enrichSubscription(sub: typeof subscriptions.$inferSelect): Subscription {
    const endDate = new Date(sub.endDate);
    const now = new Date();
    const timeDiff = endDate.getTime() - now.getTime();
    const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const isExpired = endDate < now;
    
    // Calculate progress percentage (0% = expired, 100% = just started)
    const totalDays = 365; // Assuming 1 year subscription
    const progressPercentage = Math.max(0, Math.min(100, ((totalDays - daysUntilExpiry) / totalDays) * 100));
    
    return {
      ...sub,
      isExpired,
      daysUntilExpiry,
      progressPercentage,
    } as Subscription;
  }

  async getSubscriptionStats(): Promise<{
    total: number;
    valid: number;
    expiring: number;
    expired: number;
  }> {
    const now = sql`now()`;
    
    const [stats] = await db.select({
      total: sql<number>`count(*)::int`,
      expired: sql<number>`count(*) filter (where ${subscriptions.endDate} < ${now})::int`,
      expiring: sql<number>`count(*) filter (where ${subscriptions.endDate} >= ${now} and ${subscriptions.endDate} <= ${now} + interval '30 days')::int`,
      valid: sql<number>`count(*) filter (where ${subscriptions.endDate} > ${now} + interval '30 days')::int`
    }).from(subscriptions);

    return stats;
  }
}

class InMemoryStorage implements IStorage {
  private items: Certificate[] = [];
  private subscriptionItems: Subscription[] = [];

  private calculateDaysUntilExpiry(expiryDate: Date): number {
    const now = new Date();
    const timeDiff = expiryDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  private isExpired(expiryDate: Date): boolean {
    return new Date() > expiryDate;
  }

  private enrichCertificate(cert: Omit<Certificate, "isExpired" | "daysUntilExpiry">): Certificate {
    const expiryDate = new Date(cert.expiryDate);
    return {
      ...cert,
      isExpired: this.isExpired(expiryDate),
      daysUntilExpiry: this.calculateDaysUntilExpiry(expiryDate),
    } as Certificate;
  }

  private enrichSubscription(sub: Omit<Subscription, "isExpired" | "daysUntilExpiry" | "progressPercentage">): Subscription {
    const endDate = new Date(sub.endDate);
    const now = new Date();
    const timeDiff = endDate.getTime() - now.getTime();
    const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const isExpired = endDate < now;
    
    // Calculate progress percentage (0% = expired, 100% = just started)
    const totalDays = 365; // Assuming 1 year subscription
    const progressPercentage = Math.max(0, Math.min(100, ((totalDays - daysUntilExpiry) / totalDays) * 100));
    
    return {
      ...sub,
      isExpired,
      daysUntilExpiry,
      progressPercentage,
    } as Subscription;
  }

  // Certificate methods
  async getCertificate(id: string): Promise<Certificate | undefined> {
    return this.items.find(i => i.id === id);
  }

  async getCertificates(params?: SearchCertificatesParams): Promise<Certificate[]> {
    let results = [...this.items];
    const now = new Date();
    if (params?.status && params.status !== "all") {
      if (params.status === "expired") results = results.filter(c => new Date(c.expiryDate) < now);
      if (params.status === "expiring") {
        const in30 = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
        results = results.filter(c => new Date(c.expiryDate) >= now && new Date(c.expiryDate) <= in30);
      }
      if (params.status === "valid") {
        const in30 = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
        results = results.filter(c => new Date(c.expiryDate) > in30);
      }
    }
    results.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    if (typeof params?.offset === "number") results = results.slice(params.offset);
    if (typeof params?.limit === "number") results = results.slice(0, params.limit);
    return results;
  }

  async createCertificate(insertCertificate: InsertCertificate): Promise<Certificate> {
    const cert = this.enrichCertificate({
      id: randomUUID(),
      uploadedAt: new Date(),
      ...insertCertificate,
    } as any);
    this.items.push(cert);
    return cert;
  }

  async updateCertificate(id: string, updates: UpdateCertificate): Promise<Certificate | undefined> {
    const index = this.items.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    const updated = this.enrichCertificate({ ...this.items[index], ...updates } as any);
    this.items[index] = updated;
    return updated;
  }

  async deleteCertificate(id: string): Promise<boolean> {
    const before = this.items.length;
    this.items = this.items.filter(i => i.id !== id);
    return this.items.length < before;
  }

  async searchCertificates(query: string): Promise<Certificate[]> {
    const q = query.toLowerCase();
    if (!q.trim()) return this.getCertificates();
    return this.items.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.issuer ?? "").toLowerCase().includes(q) ||
      (c.ocrText ?? "").toLowerCase().includes(q) ||
      c.fileName.toLowerCase().includes(q)
    );
  }

  async getCertificateStats(): Promise<{ total: number; valid: number; expiring: number; expired: number; }>{
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
    const total = this.items.length;
    const expired = this.items.filter(c => new Date(c.expiryDate) < now).length;
    const expiring = this.items.filter(c => new Date(c.expiryDate) >= now && new Date(c.expiryDate) <= in30).length;
    const valid = this.items.filter(c => new Date(c.expiryDate) > in30).length;
    return { total, valid, expiring, expired };
  }

  // Subscription methods
  async getSubscription(id: string): Promise<Subscription | undefined> {
    return this.subscriptionItems.find(i => i.id === id);
  }

  async getSubscriptions(): Promise<Subscription[]> {
    return this.subscriptionItems;
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const sub = this.enrichSubscription({
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...insertSubscription,
    } as any);
    this.subscriptionItems.push(sub);
    return sub;
  }

  async updateSubscription(id: string, updates: UpdateSubscription): Promise<Subscription | undefined> {
    const index = this.subscriptionItems.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    const updated = this.enrichSubscription({ 
      ...this.subscriptionItems[index], 
      ...updates,
      updatedAt: new Date()
    } as any);
    this.subscriptionItems[index] = updated;
    return updated;
  }

  async deleteSubscription(id: string): Promise<boolean> {
    const before = this.subscriptionItems.length;
    this.subscriptionItems = this.subscriptionItems.filter(i => i.id !== id);
    return this.subscriptionItems.length < before;
  }

  async getSubscriptionStats(): Promise<{ total: number; valid: number; expiring: number; expired: number; }>{
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
    const total = this.subscriptionItems.length;
    const expired = this.subscriptionItems.filter(c => new Date(c.endDate) < now).length;
    const expiring = this.subscriptionItems.filter(c => new Date(c.endDate) >= now && new Date(c.endDate) <= in30).length;
    const valid = this.subscriptionItems.filter(c => new Date(c.endDate) > in30).length;
    return { total, valid, expiring, expired };
  }
}

const useInMemory = !process.env.DATABASE_URL;
export const storage: IStorage = useInMemory ? new InMemoryStorage() : new PostgreSQLStorage();
