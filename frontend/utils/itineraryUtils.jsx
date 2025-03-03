const GEMINI_API_KEY = "AIzaSyAubf4ILpZZVxG_z8hkc9uGhYuB8SQJLOY";
const TRIPADVISOR_API_KEY = "0FA9609134844821ADC9383F3C185B7A";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Enhanced prompt template
const PROMPT_TEMPLATE = (location, groupSize, budget) => `
Generate a STRICT 1-day itinerary for ${groupSize} people in ${location} with a ${budget} budget.
Each activity must include a specific, real-world location name and address in ${location}.
Use EXACTLY this format for each activity line:

Morning: [Activity Name] - [Specific Location Name, Address]
Afternoon: [Activity Name] - [Specific Location Name, Address]
Evening: [Activity Name] - [Specific Location Name, Address]

Example valid response:
Morning: Central Park Visit - Central Park, 59th to 110th Street, New York, NY
Afternoon: Metropolitan Museum Tour - 1000 5th Ave, New York, NY 10028
Evening: Broadway Show - 1681 Broadway, New York, NY 10019

Now generate for ${location}:
`;

// Main itinerary generation function
export const generateItinerary = async (location, groupSize, budget) => {
  try {
    console.log(`Generating itinerary for: ${location}`);
    const itineraryText = await getGeminiItinerary(location, groupSize, budget);
    const activities = parseItineraryText(itineraryText, location);
    return await enrichWithTripAdvisor(activities);
  } catch (error) {
    console.error("Itinerary generation failed:", error);
    throw new Error(`Failed to generate itinerary: ${error.message}`);
  }
};

const getGeminiItinerary = async (location, groupSize, budget) => {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: PROMPT_TEMPLATE(location, groupSize, budget)
          }]
        }]
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
// Robust parsing with validation
const parseItineraryText = (text, originalLocation) => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const activities = [];
  const timeBlocks = ["Morning:", "Afternoon:", "Evening:"];

  for (const line of lines) {
    for (const block of timeBlocks) {
      if (line.startsWith(block)) {
        const cleanLine = line.replace(block, '').trim();
        const parts = cleanLine.split(/-(.*)/s).map(p => p.trim());
        
        if (parts.length >= 2 && !parts[1].toLowerCase().includes("undefined")) {
          activities.push({
            time: block.replace(':', ''),
            title: parts[0],
            location: parts[1] || originalLocation,
            originalLocation
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

// Enrich activities with TripAdvisor data
const enrichWithTripAdvisor = async (activities) => {
  try {
    return await Promise.all(activities.map(async (activity) => {
      try {
        const searchParams = new URLSearchParams({
          key: TRIPADVISOR_API_KEY,
          searchQuery: `${activity.title} ${activity.location}`,
          language: "en",
          category: "attractions" // Focus on attractions
        });

        const searchResponse = await fetch(
          `https://api.content.tripadvisor.com/api/v1/location/search?${searchParams}`
        );

        if (!searchResponse.ok) throw new Error("TripAdvisor search failed");
        
        const searchData = await searchResponse.json();
        const firstResult = searchData.data?.[0];

        if (!firstResult) {
          console.warn(`No TripAdvisor results found for: ${activity.title} - ${activity.location}`);
          return {
            ...activity,
            status: "error",
            error: "No details found on TripAdvisor"
          };
        }

        // Fetch details for the first result
        const detailsResponse = await fetch(
          `https://api.content.tripadvisor.com/api/v1/location/${firstResult.location_id}/details?key=${TRIPADVISOR_API_KEY}&language=en`
        );

        if (!detailsResponse.ok) throw new Error("TripAdvisor details fetch failed");

        const detailsData = await detailsResponse.json();

        return {
          ...activity,
          image: detailsData.photo?.images?.medium?.url || null,
          rating: detailsData.rating || "N/A",
          price: detailsData.price_level || "N/A",
          link: detailsData.web_url || "#",
          status: "complete"
        };
        
      } catch (error) {
        console.error(`TripAdvisor error for ${activity.title}:`, error);
        return { ...activity, status: "error", error: "Could not load details" };
      }
    }));
    
  } catch (error) {
    console.error("TripAdvisor enrichment failed:", error);
    return activities.map(a => ({ ...a, status: "error" }));
  }
};
// Regenerate single activity
const regenerateActivity = async (timeBlock, location, groupSize, budget) => {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate a ${timeBlock} activity for ${groupSize} people in ${location} with a ${budget} budget.
            Provide a specific, real-world location name and address in ${location}.
            Use format: [Activity Title] - [Specific Location Name, Address]`
          }]
        }]
      })
    });

    if (!response.ok) throw new Error("Regeneration failed");
    
    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) throw new Error("Invalid regeneration response");
    
    const [title, loc] = rawText.split(" - ").map(s => s.trim());
    
    if (!title || !loc) throw new Error("Could not parse regenerated activity");
    
    return { time: timeBlock, title, location: loc, status: "pending" };
    
  } catch (error) {
    console.error("Regeneration error:", error);
    throw new Error(`Failed to regenerate activity: ${error.message}`);
  }
};

const handleRegenerate = async (time) => {
  try {
    setRegenerating(time);
    const newActivity = await regenerateActivity(
      time,
      params.location,
      params.groupSize,
      params.budget
    );
    
    setItinerary(prev => 
      prev.map(activity => 
        activity.time === time ? newActivity : activity
      )
    );
    
    const enriched = await enrichWithTripAdvisor([newActivity]);
    setItinerary(prev => 
      prev.map(activity => 
        activity.time === time ? enriched[0] : activity
      )
    );
  } catch (err) {
    Alert.alert("Regeneration Failed", err.message);
  } finally {
    setRegenerating(null);
  }
};