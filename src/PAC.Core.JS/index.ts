/**
 * PAC (Personal Address Code) - TypeScript/JavaScript SDK
 * Converts geographic coordinates to/from short, shareable text codes
 */

const BASE32_CHARS = '0123456789BCDEFGHJKMNPQRSTUVWXYZ';
const DEFAULT_PRECISION = 8;
const MAX_PRECISION = 9;
const MIN_PRECISION = 6;

export interface PACEncodeOptions {
  latitude: number;
  longitude: number;
  precision?: number;
  floor?: number;
  apartment?: string;
}

export interface PACDecodeResult {
  isValid: boolean;
  latitude?: number;
  longitude?: number;
  precision?: number;
  floor?: number;
  apartment?: string;
  reason?: string;
}

export interface PACValidateResult {
  isValid: boolean;
  precision?: number;
  reason?: string;
}

/**
 * Encodes geographic coordinates into a PAC code
 */
export function encode(options: PACEncodeOptions): string {
  const { latitude, longitude, precision = DEFAULT_PRECISION, floor, apartment } = options;

  if (latitude < -90 || latitude > 90) {
    throw new Error('Latitude must be between -90 and 90');
  }

  if (longitude < -180 || longitude > 180) {
    throw new Error('Longitude must be between -180 and 180');
  }

  if (precision < MIN_PRECISION || precision > MAX_PRECISION) {
    throw new Error(`Precision must be between ${MIN_PRECISION} and ${MAX_PRECISION}`);
  }

  // Generate geohash
  const geohash = encodeGeohash(latitude, longitude, precision);

  // Calculate check digit
  const checkDigit = calculateCheckDigit(geohash);

  // Format PAC base code
  const pacBase = formatPACBase(geohash + checkDigit);

  // Add apartment suffix if provided
  if (floor !== undefined && apartment) {
    return `${pacBase} / F${floor}-A${apartment.trim()}`;
  }

  return pacBase;
}

/**
 * Decodes a PAC code into geographic coordinates
 */
export function decode(pacCode: string): PACDecodeResult {
  if (!pacCode || pacCode.trim().length === 0) {
    return {
      isValid: false,
      reason: 'PAC code cannot be empty',
    };
  }

  // Normalize the input
  const { normalized, apartmentSuffix } = normalizeInternal(pacCode);

  if (normalized.length < MIN_PRECISION + 1) {
    return {
      isValid: false,
      reason: `PAC code too short (minimum ${MIN_PRECISION + 1} characters)`,
    };
  }

  // Extract geohash and check digit
  const geohash = normalized.substring(0, normalized.length - 1);
  const providedCheckDigit = normalized[normalized.length - 1];

  // Validate check digit
  const expectedCheckDigit = calculateCheckDigit(geohash);
  if (providedCheckDigit !== expectedCheckDigit) {
    return {
      isValid: false,
      reason: 'Invalid check digit - PAC code may be corrupted',
    };
  }

  // Decode geohash
  const { latitude, longitude } = decodeGeohash(geohash);

  // Parse apartment info if present
  let floor: number | undefined;
  let apartment: string | undefined;
  if (apartmentSuffix) {
    const match = apartmentSuffix.match(/F(\d+)-A(.+)/i);
    if (match) {
      floor = parseInt(match[1], 10);
      apartment = match[2];
    }
  }

  return {
    isValid: true,
    latitude,
    longitude,
    precision: geohash.length,
    floor,
    apartment,
  };
}

/**
 * Validates a PAC code without decoding
 */
export function validate(pacCode: string): PACValidateResult {
  if (!pacCode || pacCode.trim().length === 0) {
    return {
      isValid: false,
      reason: 'PAC code cannot be empty',
    };
  }

  const { normalized } = normalizeInternal(pacCode);

  if (normalized.length < MIN_PRECISION + 1 || normalized.length > MAX_PRECISION + 1) {
    return {
      isValid: false,
      reason: `Invalid PAC length (expected ${MIN_PRECISION + 1} to ${MAX_PRECISION + 1} characters)`,
    };
  }

  // Validate characters
  if (!normalized.split('').every((c) => BASE32_CHARS.includes(c))) {
    return {
      isValid: false,
      reason: 'PAC contains invalid characters',
    };
  }

  // Validate check digit
  const geohash = normalized.substring(0, normalized.length - 1);
  const providedCheckDigit = normalized[normalized.length - 1];
  const expectedCheckDigit = calculateCheckDigit(geohash);

  if (providedCheckDigit !== expectedCheckDigit) {
    return {
      isValid: false,
      reason: 'Invalid check digit',
    };
  }

  return {
    isValid: true,
    precision: geohash.length,
  };
}

/**
 * Normalizes a PAC code to canonical format
 */
export function normalize(pacCode: string): string {
  const { normalized, apartmentSuffix } = normalizeInternal(pacCode);
  const formatted = formatPACBase(normalized);

  if (apartmentSuffix) {
    return `${formatted} / ${apartmentSuffix}`;
  }

  return formatted;
}

// ==================== Private Helpers ====================

function normalizeInternal(input: string): { normalized: string; apartmentSuffix?: string } {
  // Split apartment suffix if present
  const parts = input.split(/[/\\]/);
  const basePart = parts[0];
  const apartmentSuffix = parts.length > 1 ? parts[1].trim().toUpperCase() : undefined;

  // Remove spaces, hyphens, convert to uppercase
  const normalized = basePart
    .toUpperCase()
    .split('')
    .filter((c) => BASE32_CHARS.includes(c))
    .join('');

  return { normalized, apartmentSuffix };
}

function formatPACBase(normalized: string): string {
  // Format as XXXX-XXXX-X or XXXX-XXXXX-X depending on length
  if (normalized.length === 9) {
    // 8 + check digit
    return `${normalized.substring(0, 4)}-${normalized.substring(4, 8)}-${normalized[8]}`;
  } else if (normalized.length === 10) {
    // 9 + check digit
    return `${normalized.substring(0, 4)}-${normalized.substring(4, 9)}-${normalized[9]}`;
  } else if (normalized.length === 7) {
    // 6 + check digit
    return `${normalized.substring(0, 3)}-${normalized.substring(3, 6)}-${normalized[6]}`;
  }

  // Default: insert hyphens every 4 chars
  let result = '';
  for (let i = 0; i < normalized.length; i++) {
    if (i > 0 && i % 4 === 0 && i < normalized.length - 1) {
      result += '-';
    }
    result += normalized[i];
  }
  return result;
}

function calculateCheckDigit(geohash: string): string {
  // Modified Luhn algorithm for Base32
  let sum = 0;
  let alternate = false;

  for (let i = geohash.length - 1; i >= 0; i--) {
    let digit = BASE32_CHARS.indexOf(geohash[i]);

    if (alternate) {
      digit *= 2;
      if (digit >= 32) {
        digit = Math.floor(digit / 32) + (digit % 32);
      }
    }

    sum += digit;
    alternate = !alternate;
  }

  const checkValue = (32 - (sum % 32)) % 32;
  return BASE32_CHARS[checkValue];
}

function encodeGeohash(latitude: number, longitude: number, precision: number): string {
  const latRange: [number, number] = [-90.0, 90.0];
  const lonRange: [number, number] = [-180.0, 180.0];

  let geohash = '';
  let bits = 0;
  let bit = 0;
  let isEven = true;

  while (geohash.length < precision) {
    let mid: number;

    if (isEven) {
      mid = (lonRange[0] + lonRange[1]) / 2;
      if (longitude > mid) {
        bit |= 1 << (4 - bits);
        lonRange[0] = mid;
      } else {
        lonRange[1] = mid;
      }
    } else {
      mid = (latRange[0] + latRange[1]) / 2;
      if (latitude > mid) {
        bit |= 1 << (4 - bits);
        latRange[0] = mid;
      } else {
        latRange[1] = mid;
      }
    }

    isEven = !isEven;
    bits++;

    if (bits === 5) {
      geohash += BASE32_CHARS[bit];
      bits = 0;
      bit = 0;
    }
  }

  return geohash;
}

function decodeGeohash(geohash: string): { latitude: number; longitude: number } {
  const latRange: [number, number] = [-90.0, 90.0];
  const lonRange: [number, number] = [-180.0, 180.0];
  let isEven = true;

  for (const c of geohash) {
    const idx = BASE32_CHARS.indexOf(c);
    if (idx === -1) {
      throw new Error(`Invalid geohash character: ${c}`);
    }

    for (let i = 4; i >= 0; i--) {
      const bitValue = (idx >> i) & 1;

      if (isEven) {
        const mid = (lonRange[0] + lonRange[1]) / 2;
        if (bitValue === 1) {
          lonRange[0] = mid;
        } else {
          lonRange[1] = mid;
        }
      } else {
        const mid = (latRange[0] + latRange[1]) / 2;
        if (bitValue === 1) {
          latRange[0] = mid;
        } else {
          latRange[1] = mid;
        }
      }

      isEven = !isEven;
    }
  }

  const latitude = (latRange[0] + latRange[1]) / 2;
  const longitude = (lonRange[0] + lonRange[1]) / 2;

  return { latitude, longitude };
}

// Default export for convenience
export default {
  encode,
  decode,
  validate,
  normalize,
};
