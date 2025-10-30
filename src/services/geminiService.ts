
import { GoogleGenAI, Type } from "@google/genai";
import { NeedStatus, NeedType, SphinxNeed } from "../types";

// Use Vite's import.meta.env for environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_API_KEY" });

const threatSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: {
                type: Type.STRING,
                description: 'A unique identifier, e.g., ATT_101'
            },
            type: {
                type: Type.STRING,
                enum: [NeedType.ATTACK],
                description: 'The type of the element. Must be "attack".'
            },
            title: {
                type: Type.STRING,
                description: 'A concise title for the attack step.'
            },
            description: {
                type: Type.STRING,
                description: 'A detailed description of the attack step.'
            },
            links: {
                type: Type.ARRAY,
                description: 'IDs of other attack steps this element is linked to. Final attack leaves should have an empty array.',
                items: { type: Type.STRING }
            }
        },
        required: ["id", "type", "title", "description", "links"]
    }
};

export async function suggestThreats(systemDescription: string): Promise<SphinxNeed[]> {
    if (!apiKey) {
        throw new Error("Gemini API key is not configured.");
    }

    const prompt = `
        You are a world-class cybersecurity expert specializing in Threat Analysis and Risk Assessment (TARA).
        Based on the following system description, generate a realistic attack tree.
        The tree should consist ONLY of a series of ATTACK steps, starting from a high-level goal and breaking it down into more granular actions.
        Do NOT generate RISK or MITIGATION nodes.
        Structure your response as a JSON array of objects according to the provided schema.
        Ensure the 'links' property correctly represents the flow of the attack tree (e.g., ATT_01 links to ATT_02). The final nodes in any path should be attack leaves with no outgoing links.
        Generate unique and sequential IDs for each element (e.g., ATT_001, ATT_002).

        System Description:
        ---
        ${systemDescription}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: threatSchema,
            },
        });

        const jsonText = response.text.trim();
        // FIX: The original Omit<...> caused type inference issues with the spread operator due to the index signature in SphinxNeed.
        // Using Pick<...> creates a more precise type for the API response, fixing the inference problem.
        const generatedNeeds: Pick<SphinxNeed, 'id' | 'type' | 'title' | 'description' | 'links'>[] = JSON.parse(jsonText);

        // Add default status and tags to the generated needs
        return generatedNeeds.map((need, index) => ({
            ...need,
            status: NeedStatus.OPEN,
            tags: ['ai-generated'],
            position: { x: (index % 4) * 250 + 50, y: Math.floor(index / 4) * 150 + 400 } // Basic layout
        }));

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get suggestions from the AI model.");
    }
}
