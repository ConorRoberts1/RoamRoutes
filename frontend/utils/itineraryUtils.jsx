const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GOOGLE_PLACES_API_URL = "https://maps.googleapis.com/maps/api/place";


const PROMPT_TEMPLATE = (location, groupSize, budget, hobbies = []) => {
  // Format hobbies into a string if they exist
  const hobbiesText = hobbies && hobbies.length > 0 
    ? `The traveler is especially interested in: ${hobbies.join(", ")}. 
       Try to include places and activities related to these interests.`
    : '';

  return `
Generate a STRICT 1-day itinerary for ${groupSize} people in ${location} with a ${budget} budget.
Each activity MUST be a **real** place in ${location}. 
NO vague names (e.g., "${location}, ${location}")
NO extra explanations, budget tips, or notes.
${hobbiesText}

**Format Example (Paris, France)**
Morning: Eiffel Tower Visit - Champ de Mars, 5 Av. Anatole France, 75007 Paris, France
Afternoon: Louvre Museum Tour - Rue de Rivoli, 75001 Paris, France
Evening: Seine River Cruise - Port de la Bourdonnais, 75007 Paris, France

**Format Example (New York, USA)**
Morning: Central Park Walk - 59th to 110th Street, New York, NY, USA
Afternoon: Metropolitan Museum Tour - 1000 5th Ave, New York, NY 10028, USA
Evening: Broadway Show - 1681 Broadway, New York, NY 10019, USA

**DO NOT** include bullet points, extra text, or anything outside the required format.
Now generate the itinerary for **${location}** that includes their interest in ${hobbies.length > 0 ? hobbies.join(", ") : "general tourism"}:
`;
};


//  **Main function to generate the itinerary**
export const generateItinerary = async (locationData, groupSize, budget, hobbies = []) => {
  try {
    if (!locationData || !locationData.name) throw new Error("Invalid location data");

    const location = locationData.name;
    console.log(`Generating itinerary for: ${location} with interests: ${hobbies.join(", ") || "none specified"}`);

    const itineraryText = await getGeminiItinerary(location, groupSize, budget, hobbies);
    const activities = parseItineraryText(itineraryText, location);

    // Enrich with Google Places details
    const enrichedActivities = await enrichWithGooglePlaces(activities, location);
    console.log("Enriched Activities:", enrichedActivities);

    return enrichedActivities;
  } catch (error) {
    console.error("Itinerary generation failed:", error);
    throw new Error(`Failed to generate itinerary: ${error.message}`);
  }
};


//  **Fetch itinerary from Gemini AI**
const getGeminiItinerary = async (location, groupSize, budget, hobbies = []) => {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT_TEMPLATE(location, groupSize, budget, hobbies) }] }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error Response:", errorData);
      throw new Error(`Gemini API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log("Raw Gemini Response:", JSON.stringify(data, null, 2));

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("Invalid response structure from Gemini API");
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error(`API request failed: ${error.message}`);
  }
};


// **Fetch place details from Google Places API**
const fetchGooglePlaceDetails = async (query, location) => {
  try {
    const searchQuery = query.includes("-") ? query.split("-")[1].trim() : query;
    const searchUrl = `${GOOGLE_PLACES_API_URL}/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id&key=${GOOGLE_PLACES_API_KEY}`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.status !== "OK" || !searchData.candidates?.[0]?.place_id) {
      throw new Error(`Place not found for query: ${searchQuery}`);
    }

    const placeId = searchData.candidates[0].place_id;
    const detailsUrl = `${GOOGLE_PLACES_API_URL}/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,rating,user_ratings_total,photos,types,price_level&key=${GOOGLE_PLACES_API_KEY}`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (detailsData.status !== "OK") {
      throw new Error("Failed to fetch place details");
    }

    const placeDetails = detailsData.result;

    // Fetch photo URLs and resolve them
    const photos = placeDetails.photos
      ? await Promise.all(
          placeDetails.photos.map(photo =>
            fetchGooglePlacePhoto(photo.photo_reference)
          )
        )
      : [];

    return {
      name: placeDetails.name || "Unknown",
      address: placeDetails.formatted_address || "Unknown",
      latitude: placeDetails.geometry?.location?.lat || 0,
      longitude: placeDetails.geometry?.location?.lng || 0,
      rating: placeDetails.rating || "N/A",
      num_reviews: placeDetails.user_ratings_total || "No reviews",
      price: placeDetails.price_level || "N/A",
      photos, 
      description: placeDetails.types?.join(", ") || "No description available",
    };
  } catch (error) {
    console.error("Error fetching Google Places data:", error.message);
    return null;
  }
};


// **Fetch photo from Google Places API**
const fetchGooglePlacePhoto = async (photoReference, maxWidth = 400) => {
  return `${GOOGLE_PLACES_API_URL}/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
};


//  **Parse itinerary response from Gemini AI**
const parseItineraryText = (text, originalLocation) => {
  const lines = text.split("\n").map(line => line.trim()).filter(line => line);
  const activities = [];
  const timeBlocks = ["Morning:", "Afternoon:", "Evening:"];

  for (const line of lines) {
    for (const block of timeBlocks) {
      if (line.startsWith(block)) {
        const cleanLine = line.replace(block, "").trim();
        const parts = cleanLine.split(/-(.*)/s).map(p => p.trim());

        if (parts.length >= 2 && !parts[1].toLowerCase().includes("undefined")) {
          activities.push({
            time: block.replace(":", ""),
            title: parts[0],
            location: parts[1] || originalLocation,
            id: `${block}-${parts[0].replace(/\s+/g, "-")}`,
          });
        }
        break;
      }
    }
  }

  if (activities.length !== 3) {
    console.error("Failed to parse activities from text:", text);
    throw new Error(`Could only find ${activities.length} valid activities (need 3)`);
  }

  return activities;
};

// 🟢 **Enrich activities with Google Places data**
export const enrichWithGooglePlaces = async (activities) => {
  return Promise.all(
    activities.map(async (activity) => {
      const enrichedData = await fetchGooglePlaceDetails(activity.title, activity.location);

      return enrichedData
        ? { ...activity, ...enrichedData }
        : {
            ...activity,
            image: null,
            rating: "N/A",
            num_reviews: "No reviews",
            price: "N/A",
            description: "No description available",
            photos: [],
            reviews: [],
          };
    })
  );
};


// 🟢 **Regenerate a single activity**
export const regenerateActivity = async (timeBlock, location, groupSize, budget) => {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Generate a ${timeBlock} activity for ${groupSize} people in ${location} with a ${budget} budget.
        Ensure the location is within ${location}, Ireland.
        Use format: [Activity Title] - [Specific Location Name, Address]` }] }]
      })
    });

    if (!response.ok) throw new Error("Regeneration failed");

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) throw new Error("Invalid regeneration response");

    const [title, loc] = rawText.split(" - ").map(s => s.trim());

    if (!title || !loc) throw new Error("Could not parse regenerated activity");

    return { time: timeBlock, title, location: loc, id: `${timeBlock}-${title.replace(/\s+/g, "-")}` };
  } catch (error) {
    console.error("Regeneration error:", error);
    throw new Error(`Failed to regenerate activity: ${error.message}`);
  }

  
};