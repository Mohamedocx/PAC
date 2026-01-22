using PAC.Core;
using System;

namespace PAC.Examples;

/// <summary>
/// Example: Delivery Service Integration
/// Shows how to use PAC for a delivery/shipping application
/// </summary>
class DeliveryServiceExample
{
    static void Main()
    {
        Console.WriteLine("=== PAC Delivery Service Example ===\n");

        // Scenario 1: Customer provides their location
        Console.WriteLine("Scenario 1: Customer Registration");
        Console.WriteLine("-----------------------------------");
        
        // Customer's GPS location
        double customerLat = 31.2357;
        double customerLng = 30.0444;
        int floor = 3;
        string apartment = "02";

        // Generate PAC code
        string customerPAC = PACCore.Encode(
            customerLat, 
            customerLng, 
            precision: 8,  // ~19m accuracy (good for buildings)
            floor: floor,
            apartment: apartment
        );

        Console.WriteLine($"Customer Location: {customerLat}, {customerLng}");
        Console.WriteLine($"Customer PAC: {customerPAC}");
        Console.WriteLine($"✅ Customer can share this code instead of full address\n");

        // Scenario 2: Driver receives PAC code
        Console.WriteLine("Scenario 2: Driver Navigation");
        Console.WriteLine("-----------------------------------");
        
        // Driver receives PAC from customer
        string receivedPAC = customerPAC;
        
        // Validate before decoding
        var validation = PACCore.Validate(receivedPAC);
        if (!validation.IsValid)
        {
            Console.WriteLine($"❌ Invalid PAC: {validation.Reason}");
            return;
        }

        Console.WriteLine($"✅ PAC is valid (Precision: {validation.Precision})");

        // Decode to get location
        var decoded = PACCore.Decode(receivedPAC);
        if (decoded.IsValid)
        {
            Console.WriteLine($"📍 Delivery Location: {decoded.Latitude}, {decoded.Longitude}");
            if (decoded.Floor.HasValue && !string.IsNullOrEmpty(decoded.Apartment))
            {
                Console.WriteLine($"🏢 Floor {decoded.Floor}, Apartment {decoded.Apartment}");
            }
            
            // Driver can now navigate using GPS
            string mapsUrl = $"https://www.google.com/maps?q={decoded.Latitude},{decoded.Longitude}";
            Console.WriteLine($"🗺️  Maps URL: {mapsUrl}");
        }

        Console.WriteLine();

        // Scenario 3: Multiple delivery points
        Console.WriteLine("Scenario 3: Batch Delivery Route");
        Console.WriteLine("-----------------------------------");

        var deliveryPoints = new[]
        {
            ("THTQ-9C8K-7 / F3-A02", "Order #1001"),
            ("R3GX-2F77-M", "Order #1002"),
            ("UPBP-BPBP-Q / F1-A05", "Order #1003"),
        };

        foreach (var (pac, orderId) in deliveryPoints)
        {
            var point = PACCore.Decode(pac);
            if (point.IsValid)
            {
                Console.WriteLine($"{orderId}: {point.Latitude:F6}, {point.Longitude:F6}");
                if (point.Floor.HasValue)
                {
                    Console.WriteLine($"  └─ Floor {point.Floor}, Apt {point.Apartment}");
                }
            }
        }

        Console.WriteLine();

        // Scenario 4: Error handling
        Console.WriteLine("Scenario 4: Error Handling");
        Console.WriteLine("-----------------------------------");

        // Test with corrupted PAC (wrong check digit)
        string corruptedPAC = "THTQ-9C8K-8"; // Changed last digit
        var corruptedResult = PACCore.Decode(corruptedPAC);
        
        if (!corruptedResult.IsValid)
        {
            Console.WriteLine($"❌ Corrupted PAC detected: {corruptedResult.Reason}");
            Console.WriteLine("   Driver should ask customer to resend PAC");
        }

        Console.WriteLine();

        // Scenario 5: Normalization
        Console.WriteLine("Scenario 5: PAC Normalization");
        Console.WriteLine("-----------------------------------");

        // Customer might send PAC in different formats
        string[] userInputs = new[]
        {
            "thtq 9c8k 7",           // lowercase with spaces
            "THTQ9C8K7",             // no hyphens
            "thtq-9c8k-7/f3-a02",    // mixed case
        };

        foreach (var input in userInputs)
        {
            string normalized = PACCore.Normalize(input);
            Console.WriteLine($"Input:      {input}");
            Console.WriteLine($"Normalized: {normalized}");
            Console.WriteLine();
        }

        // Scenario 6: Distance calculation (bonus)
        Console.WriteLine("Scenario 6: Distance Calculation");
        Console.WriteLine("-----------------------------------");

        var point1 = PACCore.Decode("THTQ-9C8K-7");
        var point2 = PACCore.Decode("R3GX-2F77-M");

        if (point1.IsValid && point2.IsValid)
        {
            double distance = CalculateDistance(
                point1.Latitude!.Value, point1.Longitude!.Value,
                point2.Latitude!.Value, point2.Longitude!.Value
            );
            
            Console.WriteLine($"Distance between deliveries: {distance:F2} km");
        }

        Console.WriteLine("\n=== Example Complete ===");
    }

    /// <summary>
    /// Calculate distance between two points using Haversine formula
    /// </summary>
    static double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371; // Earth's radius in km

        double dLat = ToRadians(lat2 - lat1);
        double dLon = ToRadians(lon2 - lon1);

        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return R * c;
    }

    static double ToRadians(double degrees)
    {
        return degrees * Math.PI / 180;
    }
}
