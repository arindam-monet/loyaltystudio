import crypto from 'crypto';

/**
 * Interface for merchant data that can be anonymized
 */
interface AnonymizableMerchant {
  id?: string;
  name?: string;
  email?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  industry?: string;
  currency?: string;
  timezone?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

/**
 * Service for anonymizing and de-anonymizing sensitive business data
 * when interacting with AI services
 */
export class DataAnonymizerService {
  // Maps to store original values and their anonymized versions
  private nameMap: Map<string, string> = new Map();
  private emailMap: Map<string, string> = new Map();
  private websiteMap: Map<string, string> = new Map();
  private phoneMap: Map<string, string> = new Map();
  private addressMap: Map<string, string> = new Map();

  // Salt for hashing - this would ideally be an environment variable in production
  private salt = 'loyalty-studio-salt';

  /**
   * Reset all mapping data
   */
  public reset(): void {
    this.nameMap.clear();
    this.emailMap.clear();
    this.websiteMap.clear();
    this.phoneMap.clear();
    this.addressMap.clear();
  }

  /**
   * Anonymize a merchant object
   * @param merchant The merchant data to anonymize
   * @returns Anonymized merchant data
   */
  public anonymizeMerchant<T extends AnonymizableMerchant>(merchant: T): T {
    // Create a deep copy to avoid modifying the original
    const anonymized = JSON.parse(JSON.stringify(merchant)) as T;

    // Reset maps to ensure clean state for each anonymization
    this.reset();

    // Anonymize name if present
    if (anonymized.name) {
      const anonymizedName = this.anonymizeName(anonymized.name);
      this.nameMap.set(anonymizedName, anonymized.name);
      anonymized.name = anonymizedName;
    }

    // Anonymize email if present
    if (anonymized.email) {
      const anonymizedEmail = this.anonymizeEmail(anonymized.email);
      this.emailMap.set(anonymizedEmail, anonymized.email);
      anonymized.email = anonymizedEmail;
    }

    // Anonymize website if present
    if (anonymized.website) {
      const anonymizedWebsite = this.anonymizeWebsite(anonymized.website);
      this.websiteMap.set(anonymizedWebsite, anonymized.website);
      anonymized.website = anonymizedWebsite;
    }

    // Anonymize phone if present
    if (anonymized.phone) {
      const anonymizedPhone = this.anonymizePhone(anonymized.phone);
      this.phoneMap.set(anonymizedPhone, anonymized.phone);
      anonymized.phone = anonymizedPhone;
    }

    // Anonymize address-related fields if present
    if (anonymized.address) {
      const anonymizedAddress = this.anonymizeText(anonymized.address);
      this.addressMap.set(anonymizedAddress, anonymized.address);
      anonymized.address = anonymizedAddress;
    }

    if (anonymized.city) {
      anonymized.city = this.anonymizeText(anonymized.city);
    }

    if (anonymized.state) {
      anonymized.state = this.anonymizeText(anonymized.state);
    }

    if (anonymized.zipCode) {
      anonymized.zipCode = this.anonymizeText(anonymized.zipCode);
    }

    // Important: Do NOT anonymize industry, business type, country, currency, timezone
    // These are essential for generating relevant loyalty programs

    return anonymized;
  }

  /**
   * De-anonymize text in the AI response
   * @param text The text to de-anonymize
   * @returns De-anonymized text
   */
  public deAnonymizeText(text: string): string {
    if (!text) return text;

    let result = text;

    // Helper function to safely replace all occurrences
    const safeReplace = (anonymized: string, original: string) => {
      try {
        const escapedAnonymized = this.escapeRegExp(anonymized);
        result = result.replace(new RegExp(escapedAnonymized, 'g'), original);
      } catch (error) {
        // If regex fails, fall back to simple string replacement
        result = result.split(anonymized).join(original);
      }
    };

    // Replace anonymized names with original names
    this.nameMap.forEach((original, anonymized) => {
      safeReplace(anonymized, original);
    });

    // Replace anonymized emails with original emails
    this.emailMap.forEach((original, anonymized) => {
      safeReplace(anonymized, original);
    });

    // Replace anonymized websites with original websites
    this.websiteMap.forEach((original, anonymized) => {
      safeReplace(anonymized, original);
    });

    // Replace anonymized phones with original phones
    this.phoneMap.forEach((original, anonymized) => {
      safeReplace(anonymized, original);
    });

    // Replace anonymized addresses with original addresses
    this.addressMap.forEach((original, anonymized) => {
      safeReplace(anonymized, original);
    });

    return result;
  }

  /**
   * Anonymize a business name while preserving industry context
   * @param name The business name to anonymize
   * @returns Anonymized business name
   */
  private anonymizeName(name: string): string {
    // Generate a hash of the name
    const hash = this.generateHash(name);

    // Create a business name that preserves industry feel but is anonymized
    // Extract first letter to maintain some context
    const firstLetter = name.charAt(0).toUpperCase();

    // Create a name like "A-Business-12345"
    return `${firstLetter}-Business-${hash.substring(0, 5)}`;
  }

  /**
   * Anonymize an email address
   * @param email The email to anonymize
   * @returns Anonymized email
   */
  private anonymizeEmail(email: string): string {
    const hash = this.generateHash(email);
    return `contact-${hash.substring(0, 8)}@example.com`;
  }

  /**
   * Anonymize a website URL
   * @param website The website to anonymize
   * @returns Anonymized website
   */
  private anonymizeWebsite(website: string): string {
    const hash = this.generateHash(website);
    return `https://business-${hash.substring(0, 8)}.example.com`;
  }

  /**
   * Anonymize a phone number
   * @param phone The phone number to anonymize
   * @returns Anonymized phone number
   */
  private anonymizePhone(phone: string): string {
    // Create a consistent but anonymized phone number
    return `+1-555-${this.generateHash(phone).substring(0, 7)}`;
  }

  /**
   * Anonymize generic text
   * @param text The text to anonymize
   * @returns Anonymized text
   */
  private anonymizeText(text: string): string {
    const hash = this.generateHash(text);
    return `Anonymized-${hash.substring(0, 8)}`;
  }

  /**
   * Generate a deterministic hash for a string
   * @param text The text to hash
   * @returns A hash string
   */
  private generateHash(text: string): string {
    return crypto
      .createHash('sha256')
      .update(text + this.salt)
      .digest('hex');
  }

  /**
   * Escape special characters in a string for use in a regular expression
   * @param string The string to escape
   * @returns Escaped string safe for regex
   */
  private escapeRegExp(string: string): string {
    // Escape special regex characters
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
