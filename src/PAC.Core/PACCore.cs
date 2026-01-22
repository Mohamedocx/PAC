using System;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace PAC.Core;

/// <summary>
/// PAC (Personal Address Code) Core Library
/// Converts geographic coordinates to/from short, shareable text codes
/// </summary>
public static class PACCore
{
    private const string BASE32_CHARS = "0123456789BCDEFGHJKMNPQRSTUVWXYZ";
    private const int DEFAULT_PRECISION = 8;
    private const int MAX_PRECISION = 9;
    private const int MIN_PRECISION = 6;

    /// <summary>
    /// Encodes geographic coordinates into a PAC code
    /// </summary>
    /// <param name="latitude">Latitude (-90 to 90)</param>
    /// <param name="longitude">Longitude (-180 to 180)</param>
    /// <param name="precision">Geohash precision (6-9, default 8)</param>
    /// <param name="floor">Optional floor number for apartments</param>
    /// <param name="apartment">Optional apartment number</param>
    /// <returns>PAC code string</returns>
    public static string Encode(double latitude, double longitude, int precision = DEFAULT_PRECISION, int? floor = null, string? apartment = null)
    {
        if (latitude < -90 || latitude > 90)
            throw new ArgumentOutOfRangeException(nameof(latitude), "Latitude must be between -90 and 90");
        
        if (longitude < -180 || longitude > 180)
            throw new ArgumentOutOfRangeException(nameof(longitude), "Longitude must be between -180 and 180");
        
        if (precision < MIN_PRECISION || precision > MAX_PRECISION)
            throw new ArgumentOutOfRangeException(nameof(precision), $"Precision must be between {MIN_PRECISION} and {MAX_PRECISION}");

        // Generate geohash
        string geohash = EncodeGeohash(latitude, longitude, precision);
        
        // Calculate check digit
        char checkDigit = CalculateCheckDigit(geohash);
        
        // Format PAC base code with hyphens for readability
        string pacBase = FormatPACBase(geohash + checkDigit);
        
        // Add apartment suffix if provided
        if (floor.HasValue && !string.IsNullOrWhiteSpace(apartment))
        {
            return $"{pacBase} / F{floor.Value}-A{apartment.Trim()}";
        }
        
        return pacBase;
    }

    /// <summary>
    /// Decodes a PAC code into geographic coordinates
    /// </summary>
    public static PACDecodeResult Decode(string pacCode)
    {
        if (string.IsNullOrWhiteSpace(pacCode))
        {
            return new PACDecodeResult
            {
                IsValid = false,
                Reason = "PAC code cannot be empty"
            };
        }

        // Normalize the input
        var normalized = NormalizeInternal(pacCode, out string? apartmentSuffix);
        
        if (normalized.Length < MIN_PRECISION + 1)
        {
            return new PACDecodeResult
            {
                IsValid = false,
                Reason = $"PAC code too short (minimum {MIN_PRECISION + 1} characters)"
            };
        }

        // Extract geohash and check digit
        string geohash = normalized.Substring(0, normalized.Length - 1);
        char providedCheckDigit = normalized[normalized.Length - 1];
        
        // Validate check digit
        char expectedCheckDigit = CalculateCheckDigit(geohash);
        if (providedCheckDigit != expectedCheckDigit)
        {
            return new PACDecodeResult
            {
                IsValid = false,
                Reason = "Invalid check digit - PAC code may be corrupted"
            };
        }

        // Decode geohash
        var (lat, lng) = DecodeGeohash(geohash);
        
        // Parse apartment info if present
        int? floor = null;
        string? apartment = null;
        if (!string.IsNullOrWhiteSpace(apartmentSuffix))
        {
            var match = Regex.Match(apartmentSuffix, @"F(\d+)-A(.+)", RegexOptions.IgnoreCase);
            if (match.Success)
            {
                floor = int.Parse(match.Groups[1].Value);
                apartment = match.Groups[2].Value;
            }
        }

        return new PACDecodeResult
        {
            IsValid = true,
            Latitude = lat,
            Longitude = lng,
            Precision = geohash.Length,
            Floor = floor,
            Apartment = apartment
        };
    }

    /// <summary>
    /// Validates a PAC code without decoding
    /// </summary>
    public static PACValidateResult Validate(string pacCode)
    {
        if (string.IsNullOrWhiteSpace(pacCode))
        {
            return new PACValidateResult
            {
                IsValid = false,
                Reason = "PAC code cannot be empty"
            };
        }

        var normalized = NormalizeInternal(pacCode, out _);
        
        if (normalized.Length < MIN_PRECISION + 1 || normalized.Length > MAX_PRECISION + 1)
        {
            return new PACValidateResult
            {
                IsValid = false,
                Reason = $"Invalid PAC length (expected {MIN_PRECISION + 1} to {MAX_PRECISION + 1} characters)"
            };
        }

        // Validate characters
        if (!normalized.All(c => BASE32_CHARS.Contains(c)))
        {
            return new PACValidateResult
            {
                IsValid = false,
                Reason = "PAC contains invalid characters"
            };
        }

        // Validate check digit
        string geohash = normalized.Substring(0, normalized.Length - 1);
        char providedCheckDigit = normalized[normalized.Length - 1];
        char expectedCheckDigit = CalculateCheckDigit(geohash);
        
        if (providedCheckDigit != expectedCheckDigit)
        {
            return new PACValidateResult
            {
                IsValid = false,
                Reason = "Invalid check digit"
            };
        }

        return new PACValidateResult
        {
            IsValid = true,
            Precision = geohash.Length
        };
    }

    /// <summary>
    /// Normalizes a PAC code to canonical format
    /// </summary>
    public static string Normalize(string pacCode)
    {
        var normalized = NormalizeInternal(pacCode, out string? apartmentSuffix);
        var formatted = FormatPACBase(normalized);
        
        if (!string.IsNullOrWhiteSpace(apartmentSuffix))
        {
            return $"{formatted} / {apartmentSuffix}";
        }
        
        return formatted;
    }

    #region Private Helpers

    private static string NormalizeInternal(string input, out string? apartmentSuffix)
    {
        apartmentSuffix = null;
        
        // Split apartment suffix if present
        var parts = input.Split(new[] { '/', '\\' }, 2);
        string basePart = parts[0];
        
        if (parts.Length > 1)
        {
            apartmentSuffix = parts[1].Trim().ToUpperInvariant();
        }

        // Remove spaces, hyphens, convert to uppercase
        return new string(basePart
            .ToUpperInvariant()
            .Where(c => BASE32_CHARS.Contains(c))
            .ToArray());
    }

    private static string FormatPACBase(string normalized)
    {
        // Format as XXXX-XXXX-X or XXXX-XXXXX-X depending on length
        if (normalized.Length == 9) // 8 + check digit
        {
            return $"{normalized.Substring(0, 4)}-{normalized.Substring(4, 4)}-{normalized[8]}";
        }
        else if (normalized.Length == 10) // 9 + check digit
        {
            return $"{normalized.Substring(0, 4)}-{normalized.Substring(4, 5)}-{normalized[9]}";
        }
        else if (normalized.Length == 7) // 6 + check digit
        {
            return $"{normalized.Substring(0, 3)}-{normalized.Substring(3, 3)}-{normalized[6]}";
        }
        
        // Default: insert hyphens every 4 chars
        var sb = new StringBuilder();
        for (int i = 0; i < normalized.Length; i++)
        {
            if (i > 0 && i % 4 == 0 && i < normalized.Length - 1)
                sb.Append('-');
            sb.Append(normalized[i]);
        }
        return sb.ToString();
    }

    private static char CalculateCheckDigit(string geohash)
    {
        // Modified Luhn algorithm for Base32
        int sum = 0;
        bool alternate = false;
        
        for (int i = geohash.Length - 1; i >= 0; i--)
        {
            int digit = BASE32_CHARS.IndexOf(geohash[i]);
            
            if (alternate)
            {
                digit *= 2;
                if (digit >= 32)
                    digit = (digit / 32) + (digit % 32);
            }
            
            sum += digit;
            alternate = !alternate;
        }
        
        int checkValue = (32 - (sum % 32)) % 32;
        return BASE32_CHARS[checkValue];
    }

    private static string EncodeGeohash(double latitude, double longitude, int precision)
    {
        double[] latRange = { -90.0, 90.0 };
        double[] lonRange = { -180.0, 180.0 };
        
        StringBuilder geohash = new StringBuilder();
        int bits = 0;
        int bit = 0;
        bool isEven = true;

        while (geohash.Length < precision)
        {
            double mid;
            
            if (isEven)
            {
                mid = (lonRange[0] + lonRange[1]) / 2;
                if (longitude > mid)
                {
                    bit |= (1 << (4 - bits));
                    lonRange[0] = mid;
                }
                else
                {
                    lonRange[1] = mid;
                }
            }
            else
            {
                mid = (latRange[0] + latRange[1]) / 2;
                if (latitude > mid)
                {
                    bit |= (1 << (4 - bits));
                    latRange[0] = mid;
                }
                else
                {
                    latRange[1] = mid;
                }
            }

            isEven = !isEven;
            bits++;

            if (bits == 5)
            {
                geohash.Append(BASE32_CHARS[bit]);
                bits = 0;
                bit = 0;
            }
        }

        return geohash.ToString();
    }

    private static (double latitude, double longitude) DecodeGeohash(string geohash)
    {
        double[] latRange = { -90.0, 90.0 };
        double[] lonRange = { -180.0, 180.0 };
        bool isEven = true;

        foreach (char c in geohash)
        {
            int idx = BASE32_CHARS.IndexOf(c);
            if (idx == -1)
                throw new ArgumentException($"Invalid geohash character: {c}");

            for (int i = 4; i >= 0; i--)
            {
                int bit = (idx >> i) & 1;
                
                if (isEven)
                {
                    double mid = (lonRange[0] + lonRange[1]) / 2;
                    if (bit == 1)
                        lonRange[0] = mid;
                    else
                        lonRange[1] = mid;
                }
                else
                {
                    double mid = (latRange[0] + latRange[1]) / 2;
                    if (bit == 1)
                        latRange[0] = mid;
                    else
                        latRange[1] = mid;
                }
                
                isEven = !isEven;
            }
        }

        double latitude = (latRange[0] + latRange[1]) / 2;
        double longitude = (lonRange[0] + lonRange[1]) / 2;
        
        return (latitude, longitude);
    }

    #endregion
}

/// <summary>
/// Result of PAC decode operation
/// </summary>
public class PACDecodeResult
{
    public bool IsValid { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public int? Precision { get; set; }
    public int? Floor { get; set; }
    public string? Apartment { get; set; }
    public string? Reason { get; set; }
}

/// <summary>
/// Result of PAC validation
/// </summary>
public class PACValidateResult
{
    public bool IsValid { get; set; }
    public int? Precision { get; set; }
    public string? Reason { get; set; }
}
