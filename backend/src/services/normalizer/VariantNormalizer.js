/**
 * VariantNormalizer
 * Extracts and standardizes product variant attributes (color, storage, RAM, size, condition)
 */
export class VariantNormalizer {
  constructor() {
    // Canonical Color Mapping
    this.colorMap = new Map([
      ['space grey', 'Space Gray'],
      ['space gray', 'Space Gray'],
      ['midnight', 'Midnight'],
      ['midnight blue', 'Midnight Blue'],
      ['starlight', 'Starlight'],
      ['natural titanium', 'Natural Titanium'],
      ['black titanium', 'Black Titanium'],
      ['white titanium', 'White Titanium'],
      ['blue titanium', 'Blue Titanium'],
      ['desert titanium', 'Desert Titanium'],
      ['phantom black', 'Phantom Black'],
      ['phantom silver', 'Phantom Silver'],
      ['titanium gray', 'Titanium Gray'],
      ['matte black', 'Matte Black'],
      ['jet black', 'Jet Black'],
      ['cosmic black', 'Cosmic Black'],
      ['silver', 'Silver'],
      ['gold', 'Gold'],
      ['rose gold', 'Rose Gold'],
      ['deep purple', 'Deep Purple'],
      ['alpine green', 'Alpine Green'],
      ['sierra blue', 'Sierra Blue'],
      ['pacific blue', 'Pacific Blue'],
      ['graphite', 'Graphite'],
      ['carbon black', 'Carbon Black'],
      ['platinum silver', 'Platinum Silver'],
      ['lunar gray', 'Lunar Gray'],
      ['white', 'White'],
      ['black', 'Black'],
      ['blue', 'Blue'],
      ['red', 'Red'],
      ['green', 'Green'],
      ['yellow', 'Yellow'],
      ['purple', 'Purple'],
      ['orange', 'Orange'],
      ['pink', 'Pink'],
    ]);

    // Common noise words in color strings
    this.colorNoise = ['color', 'edition', 'finish', 'body', 'colour'];
  }

  /**
   * Extract and standardize color attribute
   * @param {string} text - Product title or raw text
   * @returns {string | null} Canonical color name
   */
  extractColor(text) {
    if (!text || typeof text !== 'string') return null;

    const lower = text.toLowerCase();

    // Check longer multi-word colors first (e.g. 'Natural Titanium', 'Midnight Blue')
    const sortedKeys = Array.from(this.colorMap.keys()).sort((a, b) => b.length - a.length);

    for (const colorKey of sortedKeys) {
      // Look for color surrounded by word boundaries, parentheses, or commas
      const regex = new RegExp(`(?:\\(|\\b|,|-)${colorKey}(?:\\)|\\b|,|-)`, 'i');
      if (regex.test(lower)) {
        return this.colorMap.get(colorKey);
      }
    }

    return null;
  }

  /**
   * Extract and standardize storage capacity (e.g. 128GB, 256GB, 512GB, 1TB, 2TB)
   * @param {string} text
   * @returns {string | null} Standardized storage string (e.g. '512GB SSD' or '128GB')
   */
  extractStorage(text) {
    if (!text || typeof text !== 'string') return null;

    // Pattern 1: Storage with SSD/HDD/NVMe descriptor (e.g. 512GB SSD, 1TB NVMe, 256 GB SSD)
    const ssdMatch = text.match(/\b([0-9]{1,4})\s*(TB|GB|MB)\s*(SSD|HDD|NVMe|eMMC|ROM)\b/i);
    if (ssdMatch) {
      const num = ssdMatch[1];
      const unit = ssdMatch[2].toUpperCase();
      const type = ssdMatch[3].toUpperCase();
      return `${num}${unit} ${type === 'ROM' ? 'Storage' : type}`;
    }

    // Pattern 2: Flash/Phone storage (e.g. 128 GB, 256GB, 1 TB, 512GB)
    // Avoid matching RAM (which usually specifies RAM or Unified Memory)
    const storageMatch = text.match(/\b([0-9]{1,4})\s*(TB|GB)\s*(?:Storage|ROM)?(?!\s*(?:RAM|Memory|Unified Memory))\b/i);
    if (storageMatch) {
      const num = storageMatch[1];
      const unit = storageMatch[2].toUpperCase();
      return `${num}${unit}`;
    }

    return null;
  }

  /**
   * Extract and standardize RAM / Memory capacity (e.g. 8GB RAM, 16GB RAM)
   * @param {string} text
   * @returns {string | null} Standardized RAM string (e.g. '16GB RAM')
   */
  extractRAM(text) {
    if (!text || typeof text !== 'string') return null;

    // Pattern 1: Explicit RAM or Unified Memory (e.g. 16GB RAM, 16 GB Unified Memory, 8GB DDR4 RAM)
    const ramMatch = text.match(
      /\b([0-9]{1,3})\s*(GB|MB)\s*(?:Unified Memory|RAM|DDR[345](?:\s*RAM)?|Memory)\b/i
    );
    if (ramMatch) {
      const num = ramMatch[1];
      const unit = ramMatch[2].toUpperCase();
      return `${num}${unit} RAM`;
    }

    return null;
  }

  /**
   * Extract and standardize display size or watch case size (e.g. 13.6-inch, 55-inch, 44mm)
   * @param {string} text
   * @returns {string | null} Standardized size string
   */
  extractSize(text) {
    if (!text || typeof text !== 'string') return null;

    // Pattern 1: Smartwatch case size (e.g. 40mm, 44mm, 45mm, 49mm, 42 mm)
    const watchMatch = text.match(/\b(3[89]|4[0-9]|5[0-2])\s*mm\b/i);
    if (watchMatch) {
      return `${watchMatch[1]}mm`;
    }

    // Pattern 2: Metric with imperial e.g. 138.8 cm (55 inch)
    const cmWithInchMatch = text.match(
      /[0-9]{1,3}(?:\.[0-9])?\s*cm\s*\(([0-9]{1,3}(?:\.[0-9])?)\s*(?:-inch|inch|["”])\)/i
    );
    if (cmWithInchMatch && cmWithInchMatch[1]) {
      return `${cmWithInchMatch[1]}-inch`;
    }

    // Pattern 3: Prioritize exact decimal screen sizes (e.g. 13.6-inch, 15.6", 14.2-inch)
    const decimalMatch = text.match(/\b([0-9]{1,3}\.[0-9]{1,2})\s*(?:-inch|\s*inch|["”])/i);
    if (decimalMatch && decimalMatch[1]) {
      return `${decimalMatch[1]}-inch`;
    }

    // Pattern 4: Standard integer screen size (e.g. 55-inch, 65", 13-inch)
    const screenMatch = text.match(/\b([0-9]{1,3})\s*(?:-inch|\s*inch|["”])/i);
    if (screenMatch && screenMatch[1]) {
      return `${screenMatch[1]}-inch`;
    }

    return null;
  }

  /**
   * Extract condition (Brand New, Refurbished, Renewed, Open Box)
   * @param {string} text
   * @returns {'NEW' | 'REFURBISHED' | 'OPEN_BOX' | 'RENEWED'}
   */
  extractCondition(text) {
    if (!text || typeof text !== 'string') return 'NEW';

    const lower = text.toLowerCase();
    if (lower.includes('renewed')) return 'RENEWED';
    if (lower.includes('refurbished')) return 'REFURBISHED';
    if (lower.includes('open box') || lower.includes('open-box')) return 'OPEN_BOX';

    return 'NEW';
  }

  /**
   * Extract all variants into a standardized object
   * @param {string} text - Title or specification text
   * @param {object} [existingAttributes={}] - Pre-parsed attributes from retailer
   * @returns {object} Standardized variant representation
   */
  normalizeVariants(text, existingAttributes = {}) {
    const combined = `${text || ''} ${Object.values(existingAttributes).join(' ')}`;

    return {
      color: existingAttributes.color || this.extractColor(combined),
      storage: existingAttributes.storage || this.extractStorage(combined),
      ram: existingAttributes.ram || this.extractRAM(combined),
      size: existingAttributes.size || this.extractSize(combined),
      condition: this.extractCondition(combined),
    };
  }
}

export const variantNormalizer = new VariantNormalizer();
export default variantNormalizer;
