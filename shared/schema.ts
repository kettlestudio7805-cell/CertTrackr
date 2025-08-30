import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const certificates = pgTable("certificates", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  issuer: text("issuer"),
  expiryDate: timestamp("expiry_date").notNull(),
  uploadedAt: timestamp("uploaded_at").default(sql`now()`).notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  filePath: text("file_path").notNull(), // Add file path for storage
  ocrText: text("ocr_text"),
});

// New subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  email: text("email").notNull(),
  cardTitle: text("card_title").notNull(),
  endDate: timestamp("end_date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

const toDate = (val: unknown) => {
  if (val instanceof Date) return val;
  if (typeof val === 'string') {
    const str = val.trim();
    // dd/MM/yyyy
    const dmY = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dmY) {
      const [, dd, mm, yyyy] = dmY;
      const iso = `${yyyy}-${mm}-${dd}T00:00:00`;
      const d = new Date(iso);
      if (!isNaN(d.getTime())) return d;
      const dZ = new Date(`${iso}Z`);
      return dZ;
    }
    // dd-MM-yyyy
    const dmYdash = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dmYdash) {
      const [, dd, mm, yyyy] = dmYdash;
      const iso = `${yyyy}-${mm}-${dd}T00:00:00`;
      const d = new Date(iso);
      if (!isNaN(d.getTime())) return d;
      const dZ = new Date(`${iso}Z`);
      return dZ;
    }
    // If it's just a date (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const iso = `${str}T00:00:00`;
      const d = new Date(iso);
      if (!isNaN(d.getTime())) return d;
      const dZ = new Date(`${iso}Z`);
      return dZ;
    }
    // If it's a date-time with space (YYYY-MM-DD HH:MM:SS)
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)) {
      const iso = str.replace(' ', 'T');
      let d = new Date(iso);
      if (!isNaN(d.getTime())) return d;
      d = new Date(`${iso}Z`);
      return d;
    }
    // If it's already ISO-like, try as-is then with Z
    let d = new Date(str);
    if (!isNaN(d.getTime())) return d;
    d = new Date(`${str}Z`);
    return d;
  }
  // Last resort
  const d = new Date(val as any);
  return d;
};

export const insertCertificateSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().nullable().optional(),
  expiryDate: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  filePath: z.string().min(1), // Add file path validation
  ocrText: z.string().nullable().optional(),
});

export const updateCertificateSchema = z.object({
  name: z.string().min(1).optional(),
  issuer: z.string().nullable().optional(),
  expiryDate: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }).optional(),
  fileName: z.string().min(1).optional(),
  fileSize: z.number().int().positive().optional(),
  filePath: z.string().min(1).optional(), // Add file path validation
  ocrText: z.string().nullable().optional(),
});

// Subscription schemas
export const insertSubscriptionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  email: z.string().email("Invalid email address"),
  cardTitle: z.string().min(1, "Card title is required"),
  endDate: z.string().or(z.date()).transform((val) => toDate(val)),
  amount: z.number().positive("Amount must be positive"),
});

export const updateSubscriptionSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  cardTitle: z.string().min(1, "Card title is required").optional(),
  endDate: z.string().or(z.date()).transform((val) => toDate(val)).optional(),
  amount: z.number().positive("Amount must be positive").optional(),
});

export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type UpdateCertificate = z.infer<typeof updateCertificateSchema>;
export type Certificate = typeof certificates.$inferSelect & {
  isExpired: boolean;
  daysUntilExpiry: number;
};

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type UpdateSubscription = z.infer<typeof updateSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect & {
  isExpired: boolean;
  daysUntilExpiry: number;
  progressPercentage: number;
};

export const searchCertificatesSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["all", "valid", "expiring", "expired"]).default("all"),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export type SearchCertificatesParams = z.infer<typeof searchCertificatesSchema>;

// Additional type definitions for the frontend
export interface CertificateStats {
  total: number;
  active: number;
  expired: number;
  expiring: number;
}

export interface SubscriptionStats {
  total: number;
  active: number;
  expired: number;
  expiring: number;
  totalCost: number;
}

export interface FileUploadResponse {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  message: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
