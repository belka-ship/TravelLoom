import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required");
}

// Using OpenAI's o3 model for enhanced reasoning capabilities in travel advisory responses
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateTravelAdvisorResponse(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
): Promise<string> {
  console.log("Attempting to call OpenAI o3 with simple input format");
  try {
    const response = await openai.responses.create({
      model: "o3-2025-04-16",
      input: userMessage
    });

    console.log("OpenAI o3 API call successful, response received");
    return response.output_text || "I apologize, but I'm having trouble generating a response right now. Please try again.";
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      status: error.status,
      type: error.type,
    });

    if (error.code === "insufficient_quota") {
      return "I'm currently experiencing high demand. Please check your OpenAI billing settings and try again.";
    }

    if (error.code === "invalid_api_key") {
      return "There's an issue with the AI configuration. Please contact support.";
    }

    if (error.code === "model_not_found" || error.message?.includes("model")) {
      return "The AI model is currently unavailable. This might be due to organization verification still propagating (can take up to 15 minutes). Please try again shortly.";
    }

    return "I'm experiencing technical difficulties. Please try your question again in a moment.";
  }
}

export async function generateConversationTitle(
  firstMessage: string,
): Promise<string> {
  try {
    const response = await openai.responses.create({
      model: "o3-2025-04-16",
      input: `Generate a short, descriptive title (3-6 words) for this travel advisor conversation: "${firstMessage}"`
    });

    const title = response.output_text?.trim() || "Travel Consultation";
    return title.length > 50 ? title.substring(0, 47) + "..." : title;
  } catch (error) {
    console.error("Error generating conversation title:", error);
    return "Travel Consultation";
  }
}
