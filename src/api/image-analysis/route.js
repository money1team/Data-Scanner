async function handler({ imageBase64, instructions }) {
  if (!imageBase64) {
    return { error: "No image data provided." };
  }

  try {
    console.log("Image data received");

    let base64Data;
    if (imageBase64.startsWith("data:image")) {
      base64Data = imageBase64;
    } else {
      let cleanedBase64 = imageBase64;
      if (imageBase64.includes(",")) {
        cleanedBase64 = imageBase64.split(",")[1];
      } else {
        cleanedBase64 = imageBase64.replace(/\s/g, "");
      }
      base64Data = `data:image/jpeg;base64,${cleanedBase64}`;
    }

    const defaultPrompt = `
Provide an extremely detailed and comprehensive analysis of this image. Include:

1. DETAILED VISUAL DESCRIPTION: Describe everything visible in the image with precision - objects, people, text, colors, lighting, perspective, and spatial relationships.

2. CONTEXT ANALYSIS: Identify the setting, time period, purpose, and potential significance of the image.

3. TECHNICAL ASSESSMENT: Evaluate image quality, composition, focal points, and any notable photographic or artistic techniques.

4. TEXT EXTRACTION: Transcribe ALL text visible in the image verbatim, including small print, labels, signs, or watermarks.

5. DATA INTERPRETATION: If charts, graphs, or data visualizations are present, provide detailed interpretation of the data, trends, and implications.

6. OBJECT IDENTIFICATION: List and describe all distinct objects, brands, logos, or recognizable elements.

7. SUBJECT ANALYSIS: For people or living subjects, describe expressions, attire, activities, and apparent relationships.

8. CULTURAL/HISTORICAL CONTEXT: Note any cultural, historical, or social significance.

9. ANOMALIES OR SPECIAL FEATURES: Highlight anything unusual, unique, or particularly noteworthy.

10. PROFESSIONAL INSIGHTS: Provide domain-specific observations relevant to the image content (e.g., architectural details, scientific phenomena, artistic techniques).

Format your response with clear section headings and bullet points where appropriate for maximum readability.
`;

    const prompt = instructions
      ? `${instructions}\n\nPlease be extremely thorough and provide a comprehensive analysis with multiple sections covering all aspects of the image.`
      : defaultPrompt;

    console.log("Analyzing image with GPT Vision...");

    const response = await fetch("/integrations/gpt-vision/", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Data,
                },
              },
            ],
          },
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    console.log("GPT Vision API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GPT Vision API error:", errorText);
      return {
        error: `API error: ${response.status} ${response.statusText}. ${errorText}`,
      };
    }

    const result = await response.json();
    console.log("Vision API response received");

    if (
      !result ||
      !result.choices ||
      !result.choices[0] ||
      !result.choices[0].message
    ) {
      console.error("Unexpected API response format:", result);
      return {
        error: "Received invalid response format from the image analysis API",
      };
    }

    const content = result.choices[0].message.content;

    const enhancedAnalysis = content.replace(
      /^(#+)\s*(.*?)$/gm,
      (_, hashes, title) => {
        return `# ${title.trim()}`;
      }
    );

    return {
      analysis: enhancedAnalysis,
      imageUrl: base64Data,
      message: "Comprehensive image analysis completed successfully.",
    };
  } catch (error) {
    console.error("Image analysis error:", error);
    return {
      error: "Failed to analyze image: " + (error.message || "Unknown error"),
    };
  }
}