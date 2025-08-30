import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";

export class OCRService {
  private pythonScriptPath: string;

  constructor() {
    this.pythonScriptPath = path.join(process.cwd(), "server", "services", "ocr_processor.py");
  }

  async extractTextFromFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // For now, we'll simulate OCR processing since we can't install Python dependencies
      // In a real implementation, this would call Tesseract OCR
      
      const mockOcrText = this.generateMockOcrText(filePath);
      
      setTimeout(() => {
        resolve(mockOcrText);
      }, 1000); // Simulate processing time
    });
  }

  private generateMockOcrText(filePath: string): string {
    const filename = path.basename(filePath).toLowerCase();
    const randomId = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const currentDate = new Date();
    const expiryDate = new Date(currentDate.getTime() + (Math.random() * 2 + 1) * 365 * 24 * 60 * 60 * 1000);
    
    if (filename.includes('aws')) {
      return `
        AWS Certified Solutions Architect - Associate
        Certificate of Completion
        This is to certify that
        ${this.getRandomName()}
        has successfully completed the requirements for
        AWS Certified Solutions Architect - Associate
        Certificate ID: AWS-CSA-2024-${randomId}
        Issue Date: ${currentDate.toLocaleDateString()}
        Expiry Date: ${expiryDate.toLocaleDateString()}
        Amazon Web Services, Inc.
      `;
    } else if (filename.includes('google') || filename.includes('gcp')) {
      return `
        Google Cloud Professional Cloud Architect
        Certificate of Achievement
        This certifies that
        ${this.getRandomName()}
        has demonstrated proficiency in
        Google Cloud Professional Cloud Architect
        Certificate Number: GCP-PCA-2024-${randomId}
        Issued: ${currentDate.toLocaleDateString()}
        Valid Until: ${expiryDate.toLocaleDateString()}
        Google Cloud Platform
      `;
    } else if (filename.includes('microsoft') || filename.includes('azure')) {
      return `
        Microsoft Certified: Azure Fundamentals
        Certificate of Completion
        Awarded to
        ${this.getRandomName()}
        for successfully completing the requirements for
        Microsoft Azure Fundamentals (AZ-900)
        Certificate ID: MC-AZ900-2024-${randomId}
        Date Earned: ${currentDate.toLocaleDateString()}
        Expires: ${expiryDate.toLocaleDateString()}
        Microsoft Corporation
      `;
    } else if (filename.includes('cisco')) {
      return `
        Cisco Certified Network Associate (CCNA)
        Routing and Switching
        This certificate is awarded to
        ${this.getRandomName()}
        in recognition of successful completion of
        CCNA Routing and Switching
        Certificate ID: CISCO-CCNA-2024-${randomId}
        Issue Date: ${currentDate.toLocaleDateString()}
        Valid Through: ${expiryDate.toLocaleDateString()}
        Cisco Systems, Inc.
      `;
    } else if (filename.includes('resume') || filename.includes('cv')) {
      return `
        Professional Resume
        ${this.getRandomName()}
        ${this.getRandomTitle()}
        ${this.getRandomCompany()}
        Contact: ${this.getRandomEmail()}
        Phone: ${this.getRandomPhone()}
        Experience: ${Math.floor(Math.random() * 10) + 1} years
        Skills: ${this.getRandomSkills()}
        Education: ${this.getRandomEducation()}
        Date: ${currentDate.toLocaleDateString()}
      `;
    } else if (filename.includes('certificate') || filename.includes('cert')) {
      return `
        Professional Certification
        Certificate of Achievement
        This is to certify that
        ${this.getRandomName()}
        has successfully completed the requirements for
        ${this.getRandomCertification()}
        Certificate ID: CERT-2024-${randomId}
        Issue Date: ${currentDate.toLocaleDateString()}
        Expiry Date: ${expiryDate.toLocaleDateString()}
        ${this.getRandomOrganization()}
      `;
    }

    // Default mock text for unknown certificates
    return `
      ${this.getRandomCertification()}
      Certificate of Achievement
      This is to certify that
      ${this.getRandomName()}
      has successfully completed the requirements for
      ${this.getRandomCertification()} Program
      Certificate ID: CERT-2024-${randomId}
      Issue Date: ${currentDate.toLocaleDateString()}
      Expiry Date: ${expiryDate.toLocaleDateString()}
      ${this.getRandomOrganization()}
    `;
  }

  private getRandomName(): string {
    const names = [
      "John Smith", "Jane Doe", "Michael Johnson", "Sarah Wilson", "David Brown",
      "Emily Davis", "Robert Miller", "Lisa Anderson", "James Taylor", "Maria Garcia",
      "William Rodriguez", "Jennifer Martinez", "Christopher Lee", "Amanda White",
      "Daniel Thompson", "Ashley Clark", "Matthew Lewis", "Nicole Hall", "Joshua Young"
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  private getRandomTitle(): string {
    const titles = [
      "Senior Software Engineer", "Full Stack Developer", "DevOps Engineer",
      "Data Scientist", "Product Manager", "UX Designer", "System Administrator",
      "Cloud Architect", "Security Engineer", "Network Engineer"
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private getRandomCompany(): string {
    const companies = [
      "TechCorp Inc.", "Innovation Labs", "Digital Solutions", "Future Systems",
      "Global Tech", "Smart Solutions", "NextGen Technologies", "Elite Corp",
      "Advanced Systems", "Modern Solutions"
    ];
    return companies[Math.floor(Math.random() * companies.length)];
  }

  private getRandomEmail(): string {
    const domains = ["gmail.com", "yahoo.com", "outlook.com", "company.com"];
    const name = this.getRandomName().toLowerCase().replace(" ", ".");
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${name}@${domain}`;
  }

  private getRandomPhone(): string {
    return `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
  }

  private getRandomSkills(): string {
    const skills = [
      "JavaScript, React, Node.js, Python, AWS, Docker",
      "Java, Spring Boot, MySQL, Kubernetes, Azure",
      "Python, Machine Learning, TensorFlow, Google Cloud",
      "C#, .NET, SQL Server, DevOps, Jenkins",
      "Ruby, Rails, PostgreSQL, AWS, Terraform"
    ];
    return skills[Math.floor(Math.random() * skills.length)];
  }

  private getRandomEducation(): string {
    const education = [
      "Bachelor's in Computer Science, MIT",
      "Master's in Software Engineering, Stanford",
      "Bachelor's in Information Technology, Harvard",
      "Master's in Data Science, Berkeley",
      "Bachelor's in Engineering, CalTech"
    ];
    return education[Math.floor(Math.random() * education.length)];
  }

  private getRandomCertification(): string {
    const certifications = [
      "Professional Software Development",
      "Advanced Web Technologies",
      "Cloud Computing Fundamentals",
      "Data Science and Analytics",
      "Cybersecurity Essentials",
      "DevOps Engineering",
      "Full Stack Development",
      "Machine Learning Fundamentals",
      "Database Administration",
      "Network Security"
    ];
    return certifications[Math.floor(Math.random() * certifications.length)];
  }

  private getRandomOrganization(): string {
    const organizations = [
      "International Technology Institute",
      "Global Certification Board",
      "Professional Development Council",
      "Advanced Learning Academy",
      "Technology Standards Organization",
      "Digital Skills Institute",
      "Professional Excellence Center",
      "Innovation and Learning Foundation"
    ];
    return organizations[Math.floor(Math.random() * organizations.length)];
  }
}

export const ocrService = new OCRService();
