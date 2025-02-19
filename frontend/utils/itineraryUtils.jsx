export const generateItinerary = async (location, groupSize, budget) => {
  console.log("Generating itinerary for:", { location, groupSize, budget });

  const prompt = `Generate a 1-day itinerary for a group of ${groupSize} in ${location} with a budget of ${budget}. Include a morning, afternoon, and evening activity. Each activity should be a short description with a title and location.`;
  console.log("Prompt sent to Gemini:", prompt);

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyDepfKEzpYxcFIlzOn-B7BwGKGSZWFzWgs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      console.error("Gemini API Error:", errorResponse);
      throw new Error(`Gemini API Error: ${errorResponse.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    console.log("Gemini API Response:", data);

    const itineraryText = data.candidates[0].content.parts[0].text;
    console.log("Generated Itinerary Text:", itineraryText);

    // Parse the itinerary text into morning, afternoon, and evening activities
    const morning = itineraryText.match(/Morning:(.*?)(\n|$)/)?.[1]?.trim() || "No morning activity found.";
    const afternoon = itineraryText.match(/Afternoon:(.*?)(\n|$)/)?.[1]?.trim() || "No afternoon activity found.";
    const evening = itineraryText.match(/Evening:(.*?)(\n|$)/)?.[1]?.trim() || "No evening activity found.";

    console.log("Generated Itinerary:", { morning, afternoon, evening });

    return { morning, afternoon, evening };
  } catch (error) {
    console.error("Error generating itinerary:", error.message);
    throw error; // Re-throw the error to handle it in the calling function
  }
};

export const regenerateActivity = async (timeBlock, location, groupSize, budget) => {
  console.log("Regenerating activity for:", { timeBlock, location, groupSize, budget });

  const prompt = `Generate a ${timeBlock} activity for a group of ${groupSize} in ${location} with a budget of ${budget}. Include a title and location.`;
  console.log("Prompt sent to Gemini:", prompt);

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyDepfKEzpYxcFIlzOn-B7BwGKGSZWFzWgs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      console.error("Gemini API Error:", errorResponse);
      throw new Error(`Gemini API Error: ${errorResponse.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    console.log("Gemini API Response:", data);

    const activityText = data.candidates[0].content.parts[0].text;
    console.log("Regenerated Activity Text:", activityText);

    return activityText;
  } catch (error) {
    console.error("Error regenerating activity:", error.message);
    throw error; // Re-throw the error to handle it in the calling function
  }
};