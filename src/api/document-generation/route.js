async function handler({ analysisResult, format }) {
  if (!analysisResult) {
    return { error: "No analysis result provided." };
  }

  try {
    console.log(`Generating ${format} document for analysis result`);

    let fileContent = "";
    let fileName = "";
    let mimeType = "";

    // Get the analysis content
    const analysisContent =
      typeof analysisResult === "object" && analysisResult.analysis
        ? analysisResult.analysis
        : typeof analysisResult === "string"
        ? analysisResult
        : JSON.stringify(analysisResult, null, 2);

    // Format the content based on the requested document type
    switch (format.toLowerCase()) {
      case "excel":
        // For Excel, create a CSV format that Excel can open
        fileName = "analysis_report.csv";
        fileContent = formatAsCSV(analysisContent);
        mimeType = "text/csv";
        break;

      case "word":
        // For Word, create a simple HTML format that Word can open
        fileName = "analysis_report.html";
        fileContent = formatAsHTML(analysisContent);
        mimeType = "text/html";
        break;

      case "markdown":
        fileName = "analysis_report.md";
        fileContent = analysisContent; // Already in markdown format
        mimeType = "text/markdown";
        break;

      case "text":
        fileName = "analysis_report.txt";
        fileContent = formatAsPlainText(analysisContent);
        mimeType = "text/plain";
        break;

      default:
        // Default to text format
        fileName = "analysis_result.txt";
        fileContent = analysisContent;
        mimeType = "text/plain";
    }

    // Create a data URL for the file
    const dataUrl = `data:${mimeType};charset=utf-8,${encodeURIComponent(
      fileContent
    )}`;

    return {
      downloadUrl: dataUrl,
      fileName: fileName,
      message: `${
        format.charAt(0).toUpperCase() + format.slice(1)
      } document generated successfully.`,
    };
  } catch (error) {
    console.error("Document generation error:", error);
    return { error: "Failed to generate document: " + error.message };
  }
}

// Helper function to format content as plain text
function formatAsPlainText(markdownContent) {
  // Simple markdown to text conversion
  return markdownContent
    .replace(/^# (.*$)/gm, "$1\n==============================\n")
    .replace(/^## (.*$)/gm, "$1\n------------------------------\n")
    .replace(/^### (.*$)/gm, "$1\n")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/!\[(.*?)\]\((.*?)\)/g, "Image: $1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1 ($2)");
}

// Helper function to format content as HTML
function formatAsHTML(markdownContent) {
  // Convert markdown to HTML
  const lines = markdownContent.split("\n");
  let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
    h2 { color: #4f46e5; margin-top: 24px; }
    h3 { color: #7e22ce; }
    p { margin-bottom: 16px; }
    ul, ol { margin-bottom: 16px; }
    pre { background-color: #f3f4f6; padding: 15px; border-radius: 5px; overflow-x: auto; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
    th { background-color: #f3f4f6; }
  </style>
</head>
<body>
  <h1>Analysis Report</h1>
`;

  let inList = false;
  let listType = "";

  lines.forEach((line) => {
    // Handle headers
    if (line.match(/^# /)) {
      if (inList) {
        htmlContent += `</${listType}>`;
        inList = false;
      }
      htmlContent += `<h1>${line.replace(/^# /, "")}</h1>`;
    } else if (line.match(/^## /)) {
      if (inList) {
        htmlContent += `</${listType}>`;
        inList = false;
      }
      htmlContent += `<h2>${line.replace(/^## /, "")}</h2>`;
    } else if (line.match(/^### /)) {
      if (inList) {
        htmlContent += `</${listType}>`;
        inList = false;
      }
      htmlContent += `<h3>${line.replace(/^### /, "")}</h3>`;
    }
    // Handle lists
    else if (line.match(/^- /) || line.match(/^\* /)) {
      if (!inList || listType !== "ul") {
        if (inList) htmlContent += `</${listType}>`;
        htmlContent += "<ul>";
        inList = true;
        listType = "ul";
      }
      htmlContent += `<li>${line.replace(/^- /, "").replace(/^\* /, "")}</li>`;
    } else if (line.match(/^\d+\. /)) {
      if (!inList || listType !== "ol") {
        if (inList) htmlContent += `</${listType}>`;
        htmlContent += "<ol>";
        inList = true;
        listType = "ol";
      }
      htmlContent += `<li>${line.replace(/^\d+\. /, "")}</li>`;
    }
    // Handle paragraphs
    else if (line.trim() === "") {
      if (inList) {
        htmlContent += `</${listType}>`;
        inList = false;
      }
      htmlContent += "<br>";
    } else {
      if (inList) {
        htmlContent += `</${listType}>`;
        inList = false;
      }
      htmlContent += `<p>${line}</p>`;
    }
  });

  // Close any open list
  if (inList) {
    htmlContent += `</${listType}>`;
  }

  htmlContent += `<footer>
    <p><small>Generated on ${new Date().toLocaleString()}</small></p>
  </footer>
</body></html>`;

  return htmlContent;
}

// Helper function to format content as CSV
function formatAsCSV(markdownContent) {
  // Convert the analysis to a simple CSV format
  const lines = markdownContent.split("\n");
  let csvContent = "";

  // Add headers
  csvContent += "Section,Level,Content\n";

  let currentSection = "Summary";
  let currentLevel = 1;

  lines.forEach((line) => {
    if (line.match(/^# /)) {
      currentSection = line.replace(/^# /, "");
      currentLevel = 1;
    } else if (line.match(/^## /)) {
      currentSection = line.replace(/^## /, "");
      currentLevel = 2;
    } else if (line.match(/^### /)) {
      currentSection = line.replace(/^### /, "");
      currentLevel = 3;
    } else if (line.trim()) {
      // Escape quotes and format as CSV
      const escapedLine = line.replace(/"/g, '""');
      csvContent += `"${escapeCSV(
        currentSection
      )}",${currentLevel},"${escapedLine}"\n`;
    }
  });

  return csvContent;
}

// Helper function to escape CSV values
function escapeCSV(value) {
  if (typeof value !== "string") return value;
  return value.replace(/"/g, '""');
}