import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCertificateSchema, updateCertificateSchema, searchCertificatesSchema } from "@shared/schema";
import { ocrService } from "./services/ocr";
import { dateExtractor } from "./services/dateExtractor";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import * as fsSync from "fs";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get certificate statistics
  app.get("/api/certificates/stats", async (req, res) => {
    try {
      const stats = await storage.getCertificateStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch certificate statistics" });
    }
  });

  // Search certificates
  app.get("/api/certificates/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }

      const results = await storage.searchCertificates(q);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Get all certificates with optional filtering
  app.get("/api/certificates", async (req, res) => {
    try {
      // Convert query parameters to proper types
      const rawQuery = req.query;
      const params = searchCertificatesSchema.parse({
        ...rawQuery,
        limit: rawQuery.limit ? parseInt(rawQuery.limit as string, 10) : undefined,
        offset: rawQuery.offset ? parseInt(rawQuery.offset as string, 10) : undefined,
      });
      const certificates = await storage.getCertificates(params);
      res.json(certificates);
    } catch (error) {
      console.error("Query parameter error:", error);
      res.status(400).json({ message: "Invalid query parameters" });
    }
  });

  // Get single certificate
  app.get("/api/certificates/:id", async (req, res) => {
    try {
      const certificate = await storage.getCertificate(req.params.id);
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      res.json(certificate);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch certificate" });
    }
  });

  // Upload and process certificate
  app.post("/api/certificates/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Extract text using OCR
      const ocrText = await ocrService.extractTextFromFile(req.file.path);
      
      // Extract expiry date from OCR text
      const { date: extractedDate, confidence } = dateExtractor.extractExpiryDate(ocrText);

      // For now, keep the file locally since Supabase storage is not configured
      const filePath = `/api/files/${path.basename(req.file.path)}`;

      // Return OCR results for verification
      res.json({
        ocrText,
        extractedDate: extractedDate?.toISOString(),
        confidence,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        filePath: filePath, // Include the file path for later reference
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      res.status(500).json({ message: "Failed to process file" });
    }
  });

  // Serve uploaded files
  app.get("/api/files/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(process.cwd(), "uploads", filename);
      
      // Check if file exists
      if (!fsSync.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      // Get file stats
      const stats = await fs.stat(filePath);
      
      // Set appropriate headers
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      
      // Stream the file
      const fileStream = fsSync.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("File serve error:", error);
      res.status(500).json({ message: "Failed to serve file" });
    }
  });

  // Create certificate after date verification
  app.post("/api/certificates", async (req, res) => {
    try {
      const validatedData = insertCertificateSchema.parse(req.body);
      const certificate = await storage.createCertificate(validatedData);
      res.status(201).json(certificate);
    } catch (error: any) {
      console.error("Certificate creation error:", error);
      if (error?.name === 'ZodError') {
        console.error("Validation errors:", error.issues);
        res.status(400).json({ 
          message: "Invalid certificate data",
          errors: error.issues
        });
      } else {
        res.status(400).json({ message: "Invalid certificate data" });
      }
    }
  });

  // Update certificate
  app.patch("/api/certificates/:id", async (req, res) => {
    try {
      const validatedData = updateCertificateSchema.parse(req.body);
      const certificate = await storage.updateCertificate(req.params.id, validatedData);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      res.json(certificate);
    } catch (error: any) {
      console.error("Certificate update error:", error);
      if (error?.name === 'ZodError') {
        console.error("Validation errors:", error.issues);
        res.status(400).json({ 
          message: "Invalid update data",
          errors: error.issues
        });
      } else {
        res.status(400).json({ message: error.message || "Invalid update data" });
      }
    }
  });

  // Delete certificate
  app.delete("/api/certificates/:id", async (req, res) => {
    try {
      const success = await storage.deleteCertificate(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete certificate" });
    }
  });

  // ===== SUBSCRIPTION ROUTES =====

  // Get subscription statistics
  app.get("/api/subscriptions/stats", async (req, res) => {
    try {
      const stats = await storage.getSubscriptionStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription statistics" });
    }
  });

  // Get all subscriptions
  app.get("/api/subscriptions", async (req, res) => {
    try {
      const subscriptions = await storage.getSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  // Get single subscription
  app.get("/api/subscriptions/:id", async (req, res) => {
    try {
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // Create subscription
  app.post("/api/subscriptions", async (req, res) => {
    try {
      const { insertSubscriptionSchema } = await import("@shared/schema");
      const validatedData = insertSubscriptionSchema.parse(req.body);
      const subscription = await storage.createSubscription(validatedData);
      res.status(201).json(subscription);
    } catch (error: any) {
      console.error("Subscription creation error:", error);
      if (error?.name === 'ZodError') {
        console.error("Validation errors:", error.issues);
        res.status(400).json({ 
          message: "Invalid subscription data",
          errors: error.issues
        });
      } else {
        res.status(400).json({ message: "Invalid subscription data" });
      }
    }
  });

  // Update subscription
  app.patch("/api/subscriptions/:id", async (req, res) => {
    try {
      const { updateSubscriptionSchema } = await import("@shared/schema");
      const validatedData = updateSubscriptionSchema.parse(req.body);
      const subscription = await storage.updateSubscription(req.params.id, validatedData);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      res.json(subscription);
    } catch (error: any) {
      console.error("Subscription update error:", error);
      if (error?.name === 'ZodError') {
        console.error("Validation errors:", error.issues);
        res.status(400).json({ 
          message: "Invalid update data",
          errors: error.issues
        });
      } else {
        res.status(400).json({ message: error.message || "Invalid update data" });
      }
    }
  });

  // Delete subscription
  app.delete("/api/subscriptions/:id", async (req, res) => {
    try {
      const success = await storage.deleteSubscription(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete subscription" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
