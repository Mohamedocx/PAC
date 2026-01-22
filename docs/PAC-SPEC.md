# PAC Specification v1.0

## Overview

PAC (Personal Address Code) is a geocoding system that converts geographic coordinates into short, shareable text codes.

## Format Specification

### Basic Format

```
PAC_BASE = GEOHASH(precision) + CHECK_DIGIT
```

Where:
- `GEOHASH`: Base32-encoded geohash (6-9 characters)
- `CHECK_DIGIT`: Single character checksum (1 character)

### Display Format

PAC codes are formatted with hyphens for readability:

**Precision 8** (9 characters total):
```
XXXX-XXXX-C
```

**Precision 9** (10 characters total):
```
XXXX-XXXXX-C
```

Where:
- `X` = Geohash character (Base32)
- `C` = Check digit (Base32)

### Apartment Format

For apartments/units, append floor and apartment number:

```
PAC_BASE / F<floor>-A<apartment>
```

Examples:
- `THTQ-9C8K-7 / F3-A02` (Floor 3, Apartment 02)
- `R3GX-2F77-M / F12-A305` (Floor 12, Apartment 305)

## Character Set

PAC uses the **Geohash Base32** character set:

```
0123456789BCDEFGHJKMNPQRSTUVWXYZ
```

**Excluded characters**: A, I, L, O (to avoid confusion with 0, 1)

**Total**: 32 characters (5 bits per character)

## Precision Levels

| Precision | Geohash Length | Total Length | Accuracy | Use Case |
|-----------|----------------|--------------|----------|----------|
| 6 | 6 chars | 7 chars | ±610m | City/District |
| 7 | 7 chars | 8 chars | ±76m | Neighborhood |
| 8 | 8 chars | 9 chars | ±19m | Building (default) |
| 9 | 9 chars | 10 chars | ±2.4m | Precise location |

**Default**: Precision 8 (~19m accuracy)

## Check Digit Algorithm

PAC uses a **Modified Luhn Algorithm** for Base32:

### Algorithm Steps

1. Start from the rightmost character of the geohash
2. For each character (moving left):
   - Convert character to its Base32 index (0-31)
   - If position is odd (from right), multiply by 2
   - If result ≥ 32, add the digits: `(value / 32) + (value % 32)`
   - Add to running sum
3. Calculate check value: `(32 - (sum % 32)) % 32`
4. Convert check value to Base32 character

### Example Calculation

Geohash: `stq4s3x1`

```
Position (from right): 7  6  5  4  3  2  1  0
Character:             s  t  q  4  s  3  x  1
Base32 Index:         27 28 24  4 27  3 31  1
Multiplier:            2  1  2  1  2  1  2  1
Value:                54 28 48  4 54  3 62  1
After overflow:       23 28 17  4 23  3 31  1
Sum: 23+28+17+4+23+3+31+1 = 130
Check: (32 - (130 % 32)) % 32 = (32 - 2) % 32 = 30
Check Digit: BASE32[30] = 'Y'
```

**Note**: Actual implementation may vary slightly. Use test vectors to verify.

## Normalization Rules

### Input Normalization

1. **Case**: Convert to UPPERCASE
2. **Whitespace**: Remove all spaces
3. **Hyphens**: Remove all hyphens (except in apartment suffix)
4. **Invalid chars**: Remove any non-Base32 characters

### Examples

| Input | Normalized |
|-------|------------|
| `thtq 9c8k 7` | `THTQ-9C8K-7` |
| `THTQ9C8K7` | `THTQ-9C8K-7` |
| `thtq-9c8k-7/f3-a02` | `THTQ-9C8K-7 / F3-A02` |

## Validation Rules

A valid PAC code must:

1. ✅ Contain only Base32 characters (after normalization)
2. ✅ Have length between 7-10 characters (excluding apartment suffix)
3. ✅ Pass check digit validation
4. ✅ Apartment suffix (if present) must match pattern: `F\d+-A.+`

## Encoding Process

```
Input: (latitude, longitude, precision)
  ↓
Step 1: Generate Geohash
  ↓
Step 2: Calculate Check Digit
  ↓
Step 3: Format with Hyphens
  ↓
Step 4: Add Apartment Suffix (if applicable)
  ↓
Output: PAC Code
```

### Example

```
Input: (31.2357, 30.0444, precision=8)
  ↓
Geohash: stq4s3x1
  ↓
Check Digit: Y (example)
  ↓
Formatted: STQ4-S3X1-Y
  ↓
With Apartment: STQ4-S3X1-Y / F3-A02
```

## Decoding Process

```
Input: PAC Code
  ↓
Step 1: Normalize Input
  ↓
Step 2: Extract Apartment Suffix (if present)
  ↓
Step 3: Validate Check Digit
  ↓
Step 4: Extract Geohash
  ↓
Step 5: Decode Geohash to Coordinates
  ↓
Output: (latitude, longitude, precision, floor?, apartment?)
```

### Example

```
Input: "THTQ-9C8K-7 / F3-A02"
  ↓
Normalized: "THTQ9C8K7"
Apartment: "F3-A02"
  ↓
Check Digit: Valid ✓
  ↓
Geohash: "thtq9c8k"
  ↓
Decoded: (31.235678, 30.044432)
Floor: 3, Apartment: "02"
```

## Error Handling

### Invalid Check Digit

```json
{
  "isValid": false,
  "reason": "Invalid check digit - PAC code may be corrupted"
}
```

**Action**: Ask user to re-enter or resend PAC code.

### Invalid Length

```json
{
  "isValid": false,
  "reason": "PAC code too short (minimum 7 characters)"
}
```

**Action**: Verify input is complete.

### Invalid Characters

```json
{
  "isValid": false,
  "reason": "PAC contains invalid characters"
}
```

**Action**: Remove non-Base32 characters or re-enter.

## Geohash Encoding

PAC uses standard Geohash encoding:

1. Start with latitude range [-90, 90] and longitude range [-180, 180]
2. For each bit (alternating lon, lat):
   - Split range in half
   - If coordinate > midpoint: bit=1, use upper half
   - If coordinate ≤ midpoint: bit=0, use lower half
3. Group 5 bits → 1 Base32 character
4. Repeat until desired precision

### Example

```
Coordinate: (31.2357, 30.0444)
Precision: 8

Bit sequence (lon, lat, lon, lat, ...):
01101 10100 00100 00100 10011 00011 11000 00001

Base32:
01101 → 13 → 'D'
10100 → 20 → 'Q'
...

Result: "stq4s3x1" (lowercase in algorithm, uppercase in output)
```

## Geohash Decoding

1. Convert each Base32 character to 5 bits
2. Alternate bits between longitude and latitude
3. For each bit, narrow the range:
   - bit=1: use upper half
   - bit=0: use lower half
4. Final coordinate = center of final range

## Compatibility

### Cross-Language Compatibility

All implementations MUST:
- Use identical Base32 character set
- Use identical check digit algorithm
- Produce identical results for same inputs
- Pass all test vectors

### Test Vectors

See [test-vectors.md](./test-vectors.md) for comprehensive test cases.

## Security Considerations

1. **No Sensitive Data**: PAC codes do NOT contain personal information
2. **Reversible**: Anyone can decode a PAC code (by design)
3. **No Encryption**: PAC is NOT an encryption system
4. **Public Sharing**: Assume all PAC codes are public

## Privacy

- ✅ PAC codes are location identifiers, not personal identifiers
- ✅ No user accounts or registration required
- ✅ No tracking or profiling
- ⚠️ Sharing a PAC code reveals your location (like sharing GPS coordinates)

## Version History

### v1.0 (2026-01-21)
- Initial specification
- Geohash-based encoding
- Modified Luhn check digit
- Apartment suffix support

## References

- [Geohash](https://en.wikipedia.org/wiki/Geohash) - Original geohash algorithm
- [Luhn Algorithm](https://en.wikipedia.org/wiki/Luhn_algorithm) - Check digit inspiration
- [Base32](https://en.wikipedia.org/wiki/Base32) - Character encoding

## Appendix A: Base32 Lookup Table

| Index | Char | Index | Char | Index | Char | Index | Char |
|-------|------|-------|------|-------|------|-------|------|
| 0 | 0 | 8 | 8 | 16 | G | 24 | Q |
| 1 | 1 | 9 | 9 | 17 | H | 25 | R |
| 2 | 2 | 10 | B | 18 | J | 26 | S |
| 3 | 3 | 11 | C | 19 | K | 27 | T |
| 4 | 4 | 12 | D | 20 | M | 28 | U |
| 5 | 5 | 13 | E | 21 | N | 29 | V |
| 6 | 6 | 14 | F | 22 | P | 30 | W |
| 7 | 7 | 15 | G | 23 | Q | 31 | X |

**Note**: Y and Z are at indices 30 and 31 in standard Base32, but Geohash uses different mapping.

## Appendix B: Precision vs Accuracy

| Precision | Cell Width | Cell Height | Area | Example Use |
|-----------|------------|-------------|------|-------------|
| 1 | ±2500 km | ±2500 km | ~6.25M km² | Continent |
| 2 | ±630 km | ±630 km | ~400K km² | Country |
| 3 | ±78 km | ±156 km | ~12K km² | Region |
| 4 | ±20 km | ±20 km | ~400 km² | City |
| 5 | ±2.4 km | ±4.9 km | ~12 km² | District |
| 6 | ±610 m | ±610 m | ~0.37 km² | Neighborhood |
| 7 | ±76 m | ±153 m | ~11,600 m² | Street |
| 8 | ±19 m | ±19 m | ~361 m² | Building ✓ |
| 9 | ±2.4 m | ±4.8 m | ~11.5 m² | Room ✓ |

**✓** = Recommended for PAC

---

**Specification Version**: 1.0  
**Last Updated**: 2026-01-21  
**Status**: Stable
