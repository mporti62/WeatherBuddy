import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import NodeCache from "node-cache";

// Cache with 10 minute TTL
const cache = new NodeCache({ stdTTL: 600 });

// API keys from environment variables
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "";
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY || "";

export async function registerRoutes(app: Express): Promise<Server> {
  // LOCATION ENDPOINTS
  app.get("/api/location/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      
      // Check cache first
      const cacheKey = `location_${zipCode}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // Fetch location data using zipcode
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${zipCode}&key=${GOOGLE_PLACES_API_KEY}`
      );
      
      if (response.data.status !== "OK") {
        return res.status(404).json({ message: "Location not found" });
      }
      
      const result = response.data.results[0];
      
      // Extract city and state
      let city = "";
      let state = "";
      
      result.address_components.forEach((component: any) => {
        if (component.types.includes("locality")) {
          city = component.long_name;
        } else if (component.types.includes("administrative_area_level_1")) {
          state = component.short_name;
        }
      });
      
      const location = {
        zipCode,
        city,
        state,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng
      };
      
      // Save to cache
      cache.set(cacheKey, location);
      
      res.json(location);
    } catch (error) {
      console.error("Error fetching location:", error);
      res.status(500).json({ message: "Failed to fetch location" });
    }
  });
  
  app.get("/api/location/suggestions", async (req, res) => {
    try {
      const { zip } = req.query;
      
      if (!zip || typeof zip !== "string" || zip.length < 3) {
        return res.json([]);
      }
      
      // Mock data for zip code suggestions
      // In a real application, use a proper ZIP code API
      const suggestions = [
        `${zip}01 - Springfield, IL`,
        `${zip}02 - Riverside, CA`,
        `${zip}10 - Mountain View, OR`
      ];
      
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching zip suggestions:", error);
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });
  
  app.get("/api/location/coordinates", async (req, res) => {
    try {
      const { lat, lng } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      // Use reverse geocoding to get zip code from coordinates
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_PLACES_API_KEY}`
      );
      
      if (response.data.status !== "OK") {
        return res.status(404).json({ message: "Location not found" });
      }
      
      // Find postal code in address components
      let zipCode = "";
      for (const result of response.data.results) {
        for (const component of result.address_components) {
          if (component.types.includes("postal_code")) {
            zipCode = component.short_name;
            break;
          }
        }
        if (zipCode) break;
      }
      
      if (!zipCode) {
        return res.status(404).json({ message: "ZIP code not found" });
      }
      
      res.json({ zipCode });
    } catch (error) {
      console.error("Error in reverse geocoding:", error);
      res.status(500).json({ message: "Failed to get location from coordinates" });
    }
  });
  
  // WEATHER ENDPOINTS
  app.get("/api/weather/current/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      
      // Check cache first
      const cacheKey = `weather_current_${zipCode}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // Get location data first to get lat/lng
      const locationRes = await axios.get(`http://localhost:${req.socket.localPort}/api/location/${zipCode}`);
      const { latitude, longitude } = locationRes.data;
      
      // Fetch weather data using lat/lng
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );
      
      const weatherData = {
        temp: Math.round(response.data.main.temp),
        feelsLike: Math.round(response.data.main.feels_like),
        description: response.data.weather[0].description,
        condition: response.data.weather[0].main.toLowerCase(),
        windSpeed: Math.round(response.data.wind.speed),
        humidity: response.data.main.humidity,
        visibility: (response.data.visibility / 1000).toFixed(1),
        date: new Date().toISOString()
      };
      
      // Save to cache
      cache.set(cacheKey, weatherData);
      
      res.json(weatherData);
    } catch (error) {
      console.error("Error fetching current weather:", error);
      res.status(500).json({ message: "Failed to fetch current weather" });
    }
  });
  
  app.get("/api/weather/forecast/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      
      // Check cache first
      const cacheKey = `weather_forecast_${zipCode}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // Get location data first to get lat/lng
      const locationRes = await axios.get(`http://localhost:${req.socket.localPort}/api/location/${zipCode}`);
      const { latitude, longitude } = locationRes.data;
      
      // Fetch weather forecast using lat/lng
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );
      
      // Process forecast data to group by day
      const days = [];
      const dayMap = new Map();
      
      response.data.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'long' });
        
        if (!dayMap.has(day)) {
          dayMap.set(day, {
            temps: [],
            conditions: []
          });
        }
        
        const dayData = dayMap.get(day);
        dayData.temps.push(item.main.temp);
        dayData.conditions.push(item.weather[0].main.toLowerCase());
      });
      
      // Calculate high/low and most common condition for each day
      dayMap.forEach((value, key) => {
        const mostCommonCondition = value.conditions
          .sort((a: string, b: string) => 
            value.conditions.filter(v => v === a).length
            - value.conditions.filter(v => v === b).length
          )
          .pop();
          
        days.push({
          name: key,
          highTemp: Math.round(Math.max(...value.temps)),
          lowTemp: Math.round(Math.min(...value.temps)),
          condition: mostCommonCondition
        });
      });
      
      // Take only the next 5 days
      const forecastData = {
        days: days.slice(0, 5)
      };
      
      // Save to cache
      cache.set(cacheKey, forecastData);
      
      res.json(forecastData);
    } catch (error) {
      console.error("Error fetching weather forecast:", error);
      res.status(500).json({ message: "Failed to fetch weather forecast" });
    }
  });
  
  // EVENTS ENDPOINTS
  app.get("/api/events/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      
      // Check cache first
      const cacheKey = `events_${zipCode}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // Get location data first
      const locationRes = await axios.get(`http://localhost:${req.socket.localPort}/api/location/${zipCode}`);
      const { city, state } = locationRes.data;
      
      // Fetch events data using city and state
      const response = await axios.get(
        `https://app.ticketmaster.com/discovery/v2/events.json?city=${city}&stateCode=${state}&apikey=${TICKETMASTER_API_KEY}`
      );
      
      if (!response.data._embedded || !response.data._embedded.events) {
        return res.json([]);
      }
      
      const events = response.data._embedded.events.map((event: any) => {
        const date = new Date(event.dates.start.dateTime || event.dates.start.localDate);
        
        return {
          id: event.id,
          name: event.name,
          description: event.info || event.pleaseNote || "No description available",
          location: event._embedded.venues[0].name,
          day: date.getDate(),
          month: date.toLocaleString('en-US', { month: 'short' }),
          time: event.dates.start.localTime 
            ? new Date(`2000-01-01T${event.dates.start.localTime}`).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })
            : "TBD",
          categories: event.classifications
            ? [
                event.classifications[0].segment.name,
                event.classifications[0].genre?.name
              ].filter(Boolean)
            : ["Event"]
        };
      });
      
      // Save to cache
      cache.set(cacheKey, events);
      
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });
  
  // RECREATION PLACES ENDPOINTS
  app.get("/api/recreation/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      
      // Check cache first
      const cacheKey = `recreation_${zipCode}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // Get location data first
      const locationRes = await axios.get(`http://localhost:${req.socket.localPort}/api/location/${zipCode}`);
      const { latitude, longitude } = locationRes.data;
      
      // Fetch recreation places using Google Places API
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=park|museum|stadium|zoo&key=${GOOGLE_PLACES_API_KEY}`
      );
      
      if (!response.data.results || response.data.results.length === 0) {
        return res.json([]);
      }
      
      // Process places data
      const places = await Promise.all(response.data.results.slice(0, 5).map(async (place: any) => {
        // Determine tag based on types
        const tags = [];
        if (place.types.includes("park")) tags.push("park");
        if (place.types.includes("museum")) tags.push("museum");
        if (place.types.includes("stadium")) tags.push("sports");
        if (place.types.some((type: string) => ["campground", "tourist_attraction", "zoo"].includes(type))) {
          tags.push("outdoor");
        }
        if (tags.length === 0) tags.push("recreation");
        
        // For a real app, we would fetch details to get hours, but we'll mock it for now
        const hours = "8:00 - 20:00";
        
        return {
          id: place.place_id,
          name: place.name,
          description: "A popular destination with activities for visitors of all ages.",
          address: place.vicinity,
          imageUrl: place.photos && place.photos[0] 
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
            : "https://via.placeholder.com/400x300?text=No+Image",
          rating: place.rating || 4.0,
          tags,
          hours,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        };
      }));
      
      // Save to cache
      cache.set(cacheKey, places);
      
      res.json(places);
    } catch (error) {
      console.error("Error fetching recreation places:", error);
      res.status(500).json({ message: "Failed to fetch recreation places" });
    }
  });
  
  // BANKS ENDPOINTS
  app.get("/api/banks/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      
      // Check cache first
      const cacheKey = `banks_${zipCode}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // Get location data first
      const locationRes = await axios.get(`http://localhost:${req.socket.localPort}/api/location/${zipCode}`);
      const { latitude, longitude } = locationRes.data;
      
      // Fetch banks using Google Places API
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=bank&key=${GOOGLE_PLACES_API_KEY}`
      );
      
      if (!response.data.results || response.data.results.length === 0) {
        return res.json([]);
      }
      
      // Process bank data
      const banks = response.data.results.slice(0, 5).map((bank: any, index: number) => {
        // Determine if the bank is open (in a real app, would use actual hours)
        const isOpen = new Date().getHours() >= 9 && new Date().getHours() < 17;
        
        // Determine services
        const services = [];
        if (index % 3 === 0 || index % 2 === 0) services.push("ATM");
        if (index % 2 === 0) services.push("Customer Service");
        if (index % 3 === 1) services.push("Loans");
        if (index % 3 === 2) services.push("Investments");
        
        return {
          id: bank.place_id,
          name: bank.name,
          address: bank.vicinity,
          hours: "9:00 - 17:00",
          isOpen,
          services,
          distance: ((index + 1) * 0.6).toFixed(1),
          latitude: bank.geometry.location.lat,
          longitude: bank.geometry.location.lng
        };
      });
      
      // Save to cache
      cache.set(cacheKey, banks);
      
      res.json(banks);
    } catch (error) {
      console.error("Error fetching banks:", error);
      res.status(500).json({ message: "Failed to fetch banks" });
    }
  });
  
  // ENTERTAINMENT ENDPOINTS
  app.get("/api/entertainment/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      
      // Check cache first
      const cacheKey = `entertainment_${zipCode}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // Get location data first
      const locationRes = await axios.get(`http://localhost:${req.socket.localPort}/api/location/${zipCode}`);
      const { latitude, longitude } = locationRes.data;
      
      // Fetch entertainment places using Google Places API
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=restaurant|movie_theater|bowling_alley|night_club|art_gallery&key=${GOOGLE_PLACES_API_KEY}`
      );
      
      if (!response.data.results || response.data.results.length === 0) {
        return res.json(null);
      }
      
      // Process entertainment data
      const places = response.data.results;
      
      // Select a featured place (first result)
      const featured = {
        id: places[0].place_id,
        name: places[0].name,
        location: places[0].vicinity,
        description: "Experience one of the best entertainment options in your area!",
        imageUrl: places[0].photos && places[0].photos[0]
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${places[0].photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
          : "https://via.placeholder.com/400x300?text=No+Image",
        categories: places[0].types
          .filter((type: string) => !["establishment", "point_of_interest"].includes(type))
          .map((type: string) => type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "))
          .slice(0, 2)
      };
      
      // Process other entertainment options
      const options = places.slice(1, 5).map((place: any) => {
        let category = "Entertainment";
        
        if (place.types.includes("restaurant")) category = "Restaurant";
        else if (place.types.includes("movie_theater")) category = "Cinema";
        else if (place.types.includes("night_club")) category = "Night Life";
        else if (place.types.includes("art_gallery")) category = "Art";
        else if (place.types.includes("bowling_alley")) category = "Bowling";
        
        return {
          id: place.place_id,
          name: place.name,
          location: place.vicinity,
          imageUrl: place.photos && place.photos[0]
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
            : "https://via.placeholder.com/400x300?text=No+Image",
          rating: place.rating || 4.0,
          reviewCount: place.user_ratings_total || 50,
          category
        };
      });
      
      const entertainmentData = {
        featured,
        options
      };
      
      // Save to cache
      cache.set(cacheKey, entertainmentData);
      
      res.json(entertainmentData);
    } catch (error) {
      console.error("Error fetching entertainment:", error);
      res.status(500).json({ message: "Failed to fetch entertainment options" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
