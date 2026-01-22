using Xunit;
using PAC.Core;

namespace PAC.Tests;

public class PACCoreTests
{
    [Fact]
    public void Encode_BasicCoordinates_ReturnsValidPAC()
    {
        // Arrange
        double lat = 31.2357;
        double lng = 30.0444;
        int precision = 8;

        // Act
        string result = PACCore.Encode(lat, lng, precision);

        // Assert
        Assert.NotNull(result);
        Assert.Contains("-", result);
        Assert.True(result.Length >= 10); // At least XXXX-XXXX-X
    }

    [Fact]
    public void Encode_WithApartment_IncludesApartmentSuffix()
    {
        // Arrange
        double lat = 31.2357;
        double lng = 30.0444;
        int floor = 3;
        string apartment = "02";

        // Act
        string result = PACCore.Encode(lat, lng, floor: floor, apartment: apartment);

        // Assert
        Assert.Contains(" / F3-A02", result);
    }

    [Fact]
    public void Encode_InvalidLatitude_ThrowsException()
    {
        // Arrange & Act & Assert
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            PACCore.Encode(91.0, 30.0));
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            PACCore.Encode(-91.0, 30.0));
    }

    [Fact]
    public void Encode_InvalidLongitude_ThrowsException()
    {
        // Arrange & Act & Assert
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            PACCore.Encode(31.0, 181.0));
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            PACCore.Encode(31.0, -181.0));
    }

    [Fact]
    public void Decode_ValidPAC_ReturnsCorrectCoordinates()
    {
        // Arrange
        double originalLat = 31.2357;
        double originalLng = 30.0444;
        string pac = PACCore.Encode(originalLat, originalLng, 8);

        // Act
        var result = PACCore.Decode(pac);

        // Assert
        Assert.True(result.IsValid);
        Assert.NotNull(result.Latitude);
        Assert.NotNull(result.Longitude);

        // Should be within geohash precision tolerance (~19m for precision 8)
        Assert.InRange(result.Latitude.Value, originalLat - 0.01, originalLat + 0.01);
        Assert.InRange(result.Longitude.Value, originalLng - 0.01, originalLng + 0.01);
    }

    [Fact]
    public void Decode_InvalidCheckDigit_ReturnsInvalid()
    {
        // Arrange
        string validPac = PACCore.Encode(31.2357, 30.0444, 8);
        // Corrupt the check digit (last character before apartment suffix)
        string corruptedPac = validPac.Substring(0, validPac.Length - 1) + "X";

        // Act
        var result = PACCore.Decode(corruptedPac);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains("check digit", result.Reason, StringComparison.OrdinalIgnoreCase);
        Assert.Null(result.Latitude);
        Assert.Null(result.Longitude);
    }

    [Fact]
    public void Decode_WithApartment_ParsesApartmentInfo()
    {
        // Arrange
        string pac = PACCore.Encode(31.2357, 30.0444, floor: 5, apartment: "12A");

        // Act
        var result = PACCore.Decode(pac);

        // Assert
        Assert.True(result.IsValid);
        Assert.Equal(5, result.Floor);
        Assert.Equal("12A", result.Apartment);
    }

    [Fact]
    public void Validate_ValidPAC_ReturnsTrue()
    {
        // Arrange
        string pac = PACCore.Encode(31.2357, 30.0444, 8);

        // Act
        var result = PACCore.Validate(pac);

        // Assert
        Assert.True(result.IsValid);
        Assert.Equal(8, result.Precision);
    }

    [Fact]
    public void Validate_InvalidPAC_ReturnsFalse()
    {
        // Arrange
        string invalidPac = "INVALID-CODE-X";

        // Act
        var result = PACCore.Validate(invalidPac);

        // Assert
        Assert.False(result.IsValid);
        Assert.NotNull(result.Reason);
    }

    [Fact]
    public void Normalize_LowercaseWithSpaces_ReturnsUppercaseFormatted()
    {
        // Arrange
        string input = "stq4 s3x1 7";

        // Act
        string result = PACCore.Normalize(input);

        // Assert
        Assert.DoesNotContain(" ", result.Split('/')[0]); // Base part has no spaces
        Assert.All(result.Split('/')[0].Replace("-", ""), c => Assert.True(char.IsUpper(c) || char.IsDigit(c)));
    }

    [Fact]
    public void Normalize_WithApartment_PreservesApartmentFormat()
    {
        // Arrange
        string input = "stq4-s3x1-7/f3-a02";

        // Act
        string result = PACCore.Normalize(input);

        // Assert
        Assert.Contains(" / F3-A02", result);
    }

    [Fact]
    public void RoundTrip_EncodeDecode_PreservesLocation()
    {
        // Arrange
        var testCases = new (double lat, double lng)[]
        {
            (31.2357, 30.0444),   // Cairo
            (-33.8688, 151.2093), // Sydney
            (51.5074, -0.1278),   // London
            (40.7128, -74.0060),  // New York
            (0.0, 0.0),           // Equator/Prime Meridian
        };

        foreach (var (lat, lng) in testCases)
        {
            // Act
            string pac = PACCore.Encode(lat, lng, 8);
            var decoded = PACCore.Decode(pac);

            // Assert
            Assert.True(decoded.IsValid, $"Failed for ({lat}, {lng})");
            Assert.InRange(decoded.Latitude!.Value, lat - 0.01, lat + 0.01);
            Assert.InRange(decoded.Longitude!.Value, lng - 0.01, lng + 0.01);
        }
    }

    [Fact]
    public void Encode_DifferentPrecisions_ProducesDifferentLengths()
    {
        // Arrange
        double lat = 31.2357;
        double lng = 30.0444;

        // Act
        string pac6 = PACCore.Encode(lat, lng, 6);
        string pac8 = PACCore.Encode(lat, lng, 8);
        string pac9 = PACCore.Encode(lat, lng, 9);

        // Assert
        Assert.True(pac6.Replace("-", "").Length < pac8.Replace("-", "").Length);
        Assert.True(pac8.Replace("-", "").Length < pac9.Replace("-", "").Length);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("ABC")]
    [InlineData("TOOLONGCODEXXXXXXXXXXXXXXXXX")]
    public void Decode_InvalidInput_ReturnsInvalid(string invalidInput)
    {
        // Act
        var result = PACCore.Decode(invalidInput);

        // Assert
        Assert.False(result.IsValid);
        Assert.NotNull(result.Reason);
    }
}
