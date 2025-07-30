import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Car, Bed, Utensils, MapPin } from 'lucide-react';

const TripCostCalculator = ({ directions, selectedHotels, selectedPlaces, totalDurationSec }) => {
  const [fuelPrice, setFuelPrice] = useState(3.50); // per gallon
  const [vehicleMPG, setVehicleMPG] = useState(25); // miles per gallon
  const [estimatedCosts, setEstimatedCosts] = useState({
    fuel: 0,
    hotels: 0,
    restaurants: 0,
    tolls: 0,
    total: 0
  });

  // Hotel price estimates based on Google's price_level (0-4 scale)
  const getHotelPriceEstimate = (priceLevel) => {
    const priceMap = {
      0: 60,   // Free/Very Cheap
      1: 80,   // Inexpensive ($)
      2: 120,  // Moderate ($$)
      3: 180,  // Expensive ($$$)
      4: 300   // Very Expensive ($$$$)
    };
    return priceMap[priceLevel] || 100; // Default fallback
  };

  // Restaurant price estimates based on type and rating
  const getRestaurantPriceEstimate = (restaurant) => {
    const priceLevel = restaurant.price_level || 2;
    const basePrices = {
      0: 8,   // Very cheap
      1: 15,  // Inexpensive
      2: 25,  // Moderate
      3: 45,  // Expensive
      4: 70   // Very expensive
    };
    
    // Adjust based on rating (higher rated places might be slightly more expensive)
    const ratingMultiplier = restaurant.rating > 4.0 ? 1.1 : 1.0;
    return (basePrices[priceLevel] || 25) * ratingMultiplier;
  };

  // Calculate fuel costs
  const calculateFuelCost = () => {
    if (!directions?.routes?.[0]) return 0;
    
    const totalDistanceMeters = directions.routes[0].legs.reduce(
      (sum, leg) => sum + leg.distance.value, 0
    );
    const totalDistanceMiles = totalDistanceMeters * 0.000621371; // Convert to miles
    const gallonsNeeded = totalDistanceMiles / vehicleMPG;
    return gallonsNeeded * fuelPrice;
  };

  // Calculate hotel costs
  const calculateHotelCosts = () => {
    return Object.values(selectedHotels).reduce((total, hotel) => {
      return total + getHotelPriceEstimate(hotel.price_level);
    }, 0);
  };

  // Calculate restaurant costs
  const calculateRestaurantCosts = () => {
    return selectedPlaces.reduce((total, restaurant) => {
      return total + getRestaurantPriceEstimate(restaurant);
    }, 0);
  };

  // Estimate toll costs (rough estimation based on distance)
  const calculateTollCosts = () => {
    if (!directions?.routes?.[0]) return 0;
    
    const totalDistanceMeters = directions.routes[0].legs.reduce(
      (sum, leg) => sum + leg.distance.value, 0
    );
    const totalDistanceMiles = totalDistanceMeters * 0.000621371;
    
    // Rough estimate: $0.05 per mile for potential tolls
    // This is a very rough estimate - in reality, you'd want to use toll calculation APIs
    return totalDistanceMiles * 0.05;
  };

  // Update costs when dependencies change
  useEffect(() => {
    const fuel = calculateFuelCost();
    const hotels = calculateHotelCosts();
    const restaurants = calculateRestaurantCosts();
    const tolls = calculateTollCosts();
    const total = fuel + hotels + restaurants + tolls;

    setEstimatedCosts({
      fuel: fuel,
      hotels: hotels,
      restaurants: restaurants,
      tolls: tolls,
      total: total
    });
  }, [directions, selectedHotels, selectedPlaces, fuelPrice, vehicleMPG]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTripStats = () => {
    if (!directions?.routes?.[0]) return null;
    
    const totalDistanceMeters = directions.routes[0].legs.reduce(
      (sum, leg) => sum + leg.distance.value, 0
    );
    const totalDistanceMiles = totalDistanceMeters * 0.000621371;
    const totalTimeHours = totalDurationSec / 3600;
    
    return {
      distance: totalDistanceMiles,
      time: totalTimeHours
    };
  };

  const stats = getTripStats();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 m-4 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Trip Cost Estimate</h2>
      </div>

      {/* Trip Statistics */}
      {stats && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">Trip Overview</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Distance: {stats.distance.toFixed(1)} miles</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-600" />
              <span>Drive Time: {stats.time.toFixed(1)} hours</span>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Settings */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Vehicle Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fuel Price ($/gallon)
            </label>
            <input
              type="number"
              step="0.01"
              value={fuelPrice}
              onChange={(e) => setFuelPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle MPG
            </label>
            <input
              type="number"
              value={vehicleMPG}
              onChange={(e) => setVehicleMPG(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800 mb-3">Cost Breakdown</h3>
        
        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-red-600" />
            <span className="font-medium">Fuel Costs</span>
          </div>
          <span className="font-bold text-red-700">{formatCurrency(estimatedCosts.fuel)}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Bed className="w-5 h-5 text-blue-600" />
            <span className="font-medium">Hotels ({Object.keys(selectedHotels).length} nights)</span>
          </div>
          <span className="font-bold text-blue-700">{formatCurrency(estimatedCosts.hotels)}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-green-600" />
            <span className="font-medium">Restaurants ({selectedPlaces.length} stops)</span>
          </div>
          <span className="font-bold text-green-700">{formatCurrency(estimatedCosts.restaurants)}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-yellow-600" />
            <span className="font-medium">Estimated Tolls</span>
          </div>
          <span className="font-bold text-yellow-700">{formatCurrency(estimatedCosts.tolls)}</span>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between p-4 bg-gray-800 text-white rounded-lg border-2 border-gray-800">
          <span className="text-lg font-bold">Total Estimated Cost</span>
          <span className="text-2xl font-bold">{formatCurrency(estimatedCosts.total)}</span>
        </div>
      </div>

      {/* Cost per person option */}
      <div className="mt-6 p-4 bg-purple-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-purple-800">Split the cost?</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-purple-700">Number of people:</label>
          <input
            type="number"
            min="1"
            defaultValue="2"
            className="w-16 px-2 py-1 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            onChange={(e) => {
              const people = parseInt(e.target.value) || 1;
              const costPerPerson = estimatedCosts.total / people;
              e.target.nextElementSibling.textContent = formatCurrency(costPerPerson);
            }}
          />
          <span className="font-bold text-purple-800">{formatCurrency(estimatedCosts.total / 2)} per person</span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-800">
          <strong>Disclaimer:</strong> These are estimated costs based on average prices and may vary significantly. 
          Actual costs depend on specific venues, dates, seasonal pricing, and local variations.
        </p>
      </div>
    </div>
  );
};

export default TripCostCalculator;