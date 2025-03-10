async function handler({ inputData }) {
  try {
    // Call Claude API for text analysis
    const response = await fetch("/integrations/anthropic-claude-sonnet-3-5/", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: `Analyze the following data and provide insights in JSON format with sections for summary, key_points, and recommendations:\n\n${inputData}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(`Error: ${response.statusText}`);
      throw new Error(`Error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("API response:", result);

    const content = result.choices[0].message.content;
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse JSON:", parseError);
      return {
        summary: content,
        key_points: [],
        recommendations: [],
      };
    }
  } catch (error) {
    console.error("Failed to process input data:", error);
    return { error: "Failed to process input data: " + error.message };
  }
}