
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Helper to remove the data URL prefix if it exists
const stripBase64Prefix = (base64: string): string => {
  return base64.startsWith('data:') ? base64.split(',')[1] : base64;
};


export const beautifyDrawing = async (base64ImageData: string): Promise<string> => {
  try {
    const imagePart = {
      inlineData: {
        mimeType: 'image/png',
        data: stripBase64Prefix(base64ImageData),
      },
    };

    const textPart = {
      text: "Redraw this user's sketch. Make it look more polished and artistic, like a clean line drawing or a simple digital painting. Keep the original subject and composition intact, but enhance the quality. The output must be an image.",
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, imagePart] },
    });
    
    // Assuming the first part of the response is the image
    const imageResponsePart = response.candidates?.[0]?.content?.parts?.[0];
    if (imageResponsePart && 'inlineData' in imageResponsePart && imageResponsePart.inlineData) {
        const newBase64 = imageResponsePart.inlineData.data;
        return `data:image/png;base64,${newBase64}`;
    } else {
        throw new Error("AI did not return a valid image.");
    }

  } catch (error) {
    console.error("Error beautifying drawing:", error);
    throw new Error("Failed to beautify the drawing with AI. Please try again.");
  }
};
