"use client";
import React from "react";

import { useHandleStreamResponse } from "../utilities/runtime-helpers";

function MainComponent() {
  const [inputData, setInputData] = React.useState("");
  const [analysisResult, setAnalysisResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [downloadUrl, setDownloadUrl] = React.useState(null);
  const [fileName, setFileName] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState("text");
  const [imagePreview, setImagePreview] = React.useState(null);
  const [imageFile, setImageFile] = React.useState(null);
  const [streamingMessage, setStreamingMessage] = React.useState("");
  const [imageInstructions, setImageInstructions] = React.useState("");

  const handleFinish = React.useCallback((message) => {
    setAnalysisResult({ analysis: message });
    setStreamingMessage("");
    setLoading(false);
  }, []);

  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingMessage,
    onFinish: handleFinish,
  });

  const handleDataSubmit = async (e) => {
    e.preventDefault();
    if (!inputData.trim()) {
      setError("Please enter data to analyze.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    setDownloadUrl(null);
    setFileName(null);
    setStreamingMessage("");

    try {
      const response = await fetch("/api/data-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputData }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      console.log("Analysis result:", result);
      setAnalysisResult(result);
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to analyze data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStreamingDataSubmit = async (e) => {
    e.preventDefault();
    if (!inputData.trim()) {
      setError("Please enter data to analyze.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    setDownloadUrl(null);
    setFileName(null);

    try {
      const response = await fetch(
        "/integrations/anthropic-claude-sonnet-3-5/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `Analyze the following data and provide a well-structured analysis with clear sections. Include an executive summary, key insights, detailed analysis, and recommendations. Format your response in a way that's easy to read and visually organize:\n\n${inputData}`,
              },
            ],
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      handleStreamResponse(response);
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to analyze data: " + err.message);
      setLoading(false);
    }
  };

  const handleImageCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setImageFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleImageAnalysis = async () => {
    if (!imageFile) {
      setError("Please select an image to analyze.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    setDownloadUrl(null);
    setFileName(null);
    setStreamingMessage("");

    try {
      const base64Image = imagePreview;
      const instructions =
        imageInstructions.trim() ||
        "Analyze this image in detail. Describe what you see, identify any objects, people, text, or notable elements.";

      console.log("Sending image analysis request with custom instructions...");

      const response = await fetch("/api/image-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: base64Image,
          instructions: instructions,
        }),
      });

      console.log("Image analysis response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `Error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Image analysis result received");

      if (result.error) {
        throw new Error(result.error);
      }

      setAnalysisResult(result);
    } catch (err) {
      console.error("Image analysis error:", err);
      setError("Failed to analyze image: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentGeneration = async (format) => {
    if (!analysisResult) {
      setError("No analysis result to export.");
      return;
    }

    try {
      const response = await fetch("/api/document-generation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysisResult: analysisResult.analysis,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      setDownloadUrl(result.downloadUrl);
      setFileName(result.fileName);

      const link = document.createElement("a");
      link.href = result.downloadUrl;
      link.download = result.fileName || "analysis_result.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Document generation error:", err);
      setError("Failed to generate document: " + err.message);
    }
  };

  const renderAnalysisContent = () => {
    if (streamingMessage) {
      return (
        <p className="text-gray-700 whitespace-pre-wrap">{streamingMessage}</p>
      );
    }

    if (!analysisResult) return null;

    const content =
      analysisResult.analysis ||
      (typeof analysisResult === "string"
        ? analysisResult
        : JSON.stringify(analysisResult, null, 2));

    const sections = [];
    let currentSection = { title: null, content: [] };

    content.split("\n").forEach((line) => {
      if (line.startsWith("# ")) {
        if (currentSection.content.length > 0) {
          sections.push({ ...currentSection });
        }
        currentSection = {
          title: line.replace(/^# /, ""),
          level: 1,
          content: [],
        };
      } else if (line.startsWith("## ")) {
        if (currentSection.content.length > 0 || currentSection.title) {
          sections.push({ ...currentSection });
        }
        currentSection = {
          title: line.replace(/^## /, ""),
          level: 2,
          content: [],
        };
      } else if (line.startsWith("### ")) {
        if (currentSection.content.length > 0 || currentSection.title) {
          sections.push({ ...currentSection });
        }
        currentSection = {
          title: line.replace(/^### /, ""),
          level: 3,
          content: [],
        };
      } else {
        currentSection.content.push(line);
      }
    });

    if (currentSection.content.length > 0 || currentSection.title) {
      sections.push(currentSection);
    }

    if (sections.length === 0 && content) {
      sections.push({
        title: "Comprehensive Analysis",
        level: 1,
        content: content.split("\n"),
      });
    }

    return (
      <div className="space-y-6">
        {sections.map((section, index) => (
          <div key={index} className="mb-6">
            {section.title && (
              <div
                className={`mb-3 ${
                  section.level === 1
                    ? "text-2xl font-bold text-blue-700 border-b border-gray-200 pb-2"
                    : section.level === 2
                    ? "text-xl font-bold text-indigo-600"
                    : "text-lg font-semibold text-purple-600"
                }`}
              >
                {section.title}
              </div>
            )}
            <div className="space-y-2">
              {section.content.map((paragraph, pIndex) => {
                if (paragraph.match(/^- /) || paragraph.match(/^\* /)) {
                  return (
                    <div key={pIndex} className="flex ml-4">
                      <span className="mr-2">•</span>
                      <span>
                        {paragraph.replace(/^- /, "").replace(/^\* /, "")}
                      </span>
                    </div>
                  );
                } else if (paragraph.match(/^\d+\. /)) {
                  const num = paragraph.match(/^\d+/)[0];
                  return (
                    <div key={pIndex} className="flex ml-4">
                      <span className="mr-2 font-medium">{num}.</span>
                      <span>{paragraph.replace(/^\d+\. /, "")}</span>
                    </div>
                  );
                } else if (paragraph.includes("**")) {
                  const parts = paragraph.split(/(\*\*.*?\*\*)/g);
                  return (
                    <p key={pIndex} className="text-gray-700 leading-relaxed">
                      {parts.map((part, partIndex) => {
                        if (part.startsWith("**") && part.endsWith("**")) {
                          return (
                            <strong key={partIndex}>{part.slice(2, -2)}</strong>
                          );
                        }
                        return part;
                      })}
                    </p>
                  );
                } else if (paragraph.trim() !== "") {
                  return (
                    <p key={pIndex} className="text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderImageTab = () => {
    return (
      <div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Upload or capture an image to analyze
          </label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-all duration-200">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 mb-3 rounded-lg shadow-md"
                  />
                ) : (
                  <>
                    <svg
                      className="w-12 h-12 mb-3 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      ></path>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG or JPEG</p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageCapture}
              />
            </label>
          </div>
        </div>

        {imagePreview && (
          <>
            <div className="mb-4">
              <label
                htmlFor="imageInstructions"
                className="block text-gray-700 font-medium mb-2"
              >
                What would you like to know about this image? (Be specific for
                better results)
              </label>
              <textarea
                id="imageInstructions"
                name="imageInstructions"
                value={imageInstructions}
                onChange={(e) => setImageInstructions(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                placeholder="Examples: 'Provide a detailed analysis of this chart including all data points and trends', 'Extract and organize all text visible in this document', 'Identify all objects and describe their relationships in detail', etc."
                rows="4"
              />
              <p className="mt-2 text-sm text-gray-600">
                Leave blank for a comprehensive analysis covering visual
                details, context, technical aspects, text extraction, and more.
              </p>
            </div>

            <button
              onClick={handleImageAnalysis}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:from-blue-700 hover:to-indigo-700 transition duration-300 flex items-center justify-center mt-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating comprehensive analysis...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    ></path>
                  </svg>
                  Analyze Image In Detail
                </>
              )}
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Intelligent Analysis Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Transform your data and images into meaningful insights
          </p>
        </header>

        <div className="max-w-4xl mx-auto mb-6 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex border-b">
            <button
              className={`flex-1 py-4 px-4 text-center font-medium transition-all duration-200 ${
                activeTab === "text"
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("text")}
            >
              <div className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                Text Analysis
              </div>
            </button>
            <button
              className={`flex-1 py-4 px-4 text-center font-medium transition-all duration-200 ${
                activeTab === "image"
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("image")}
            >
              <div className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  ></path>
                </svg>
                Image Analysis
              </div>
            </button>
          </div>

          <div className="p-6">
            {activeTab === "text" ? (
              <form onSubmit={handleStreamingDataSubmit}>
                <div className="mb-4">
                  <label
                    htmlFor="inputData"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Enter data to analyze
                  </label>
                  <textarea
                    id="inputData"
                    name="inputData"
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                    placeholder="Enter text, numbers, or structured data to analyze..."
                    rows="6"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDataSubmit}
                    className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 flex items-center justify-center"
                    disabled={loading}
                  >
                    {loading && !streamingMessage ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          ></path>
                        </svg>
                        Analyze Data
                      </>
                    )}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 flex items-center justify-center"
                    disabled={loading}
                  >
                    {loading && streamingMessage ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Streaming...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          ></path>
                        </svg>
                        Stream Analysis
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              renderImageTab()
            )}
          </div>
        </div>

        {error && (
          <div className="max-w-4xl mx-auto mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md">
            <div className="flex">
              <svg
                className="h-6 w-6 text-red-500 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p>{error}</p>
            </div>
          </div>
        )}

        {(analysisResult || streamingMessage) && (
          <div className="max-w-4xl mx-auto mt-8 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <svg
                  className="w-6 h-6 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  ></path>
                </svg>
                {streamingMessage
                  ? "Live Analysis Results"
                  : "Analysis Results"}
              </h2>
            </div>

            <div className="p-6">
              {analysisResult && analysisResult.imageUrl && (
                <div className="mb-6 flex justify-center">
                  <img
                    src={analysisResult.imageUrl}
                    alt="Analyzed image"
                    className="max-h-64 rounded-lg shadow-md border border-gray-200"
                  />
                </div>
              )}

              <div className="prose max-w-none">{renderAnalysisContent()}</div>

              {!streamingMessage && (
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      ></path>
                    </svg>
                    Export Results
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleDocumentGeneration("text")}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg flex items-center transition-all duration-200"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12h6m-6 4h6"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainComponent;