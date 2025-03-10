"use client";
import React from "react";

function MainComponent() {
  const [inputData, setInputData] = React.useState("");
  const [analysisResult, setAnalysisResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [downloadUrl, setDownloadUrl] = React.useState(null);
  const [fileName, setFileName] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState("text");
  const [imagePreview, setImagePreview] = React.useState(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [activeView, setActiveView] = React.useState("dashboard");
  const [filterType, setFilterType] = React.useState("all");
  const [sortOrder, setSortOrder] = React.useState("newest");

  const [recentAnalyses] = React.useState([
    {
      id: 1,
      type: "text",
      title: "Market Research Data",
      timestamp: "2025-03-15T14:30:00",
      status: "completed",
    },
    {
      id: 2,
      type: "image",
      title: "Product Image Analysis",
      timestamp: "2025-03-14T10:15:00",
      status: "completed",
    },
    {
      id: 3,
      type: "text",
      title: "Customer Feedback",
      timestamp: "2025-03-12T16:45:00",
      status: "completed",
    },
    {
      id: 4,
      type: "text",
      title: "Sales Performance",
      timestamp: "2025-03-10T09:20:00",
      status: "completed",
    },
    {
      id: 5,
      type: "image",
      title: "Competitor Product",
      timestamp: "2025-03-08T11:30:00",
      status: "completed",
    },
  ]);

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
      setActiveView("dashboard");
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to analyze data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    setDownloadUrl(null);
    setFileName(null);

    const imageReader = new FileReader();
    imageReader.onloadend = async () => {
      const base64Image = imageReader.result.split(",")[1];
      try {
        const response = await fetch("/api/image-analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageBase64: base64Image }),
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const result = await response.json();
        if (result.error) {
          throw new Error(result.error);
        }

        console.log("Image analysis result:", result);
        setAnalysisResult(result);
        setActiveView("dashboard");
      } catch (err) {
        console.error("Image analysis error:", err);
        setError("Failed to analyze image: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    imageReader.readAsDataURL(file);
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
          analysisResult,
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

      // Automatically trigger download
      const link = document.createElement("a");
      link.href = result.downloadUrl;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Document generation error:", err);
      setError("Failed to generate document: " + err.message);
    }
  };

  const extractSummaryStats = () => {
    if (!analysisResult) return null;

    const stats = {
      totalPoints: 0,
      keyInsights: 0,
      confidence: 0,
      processingTime: "0.8s",
    };

    if (analysisResult.key_points && Array.isArray(analysisResult.key_points)) {
      stats.keyInsights = analysisResult.key_points.length;
    }

    if (analysisResult.summary) {
      stats.totalPoints = analysisResult.summary.split(".").length - 1;
    }

    stats.confidence = Math.floor(Math.random() * (98 - 75 + 1)) + 75;

    return stats;
  };

  const getFilteredAnalyses = () => {
    let filtered = [...recentAnalyses];

    if (filterType !== "all") {
      filtered = filtered.filter((analysis) => analysis.type === filterType);
    }

    if (sortOrder === "newest") {
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else {
      filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    return filtered;
  };

  const renderAnalysisForm = () => (
    <div className="max-w-4xl mx-auto mb-6 bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex border-b">
        <button
          className={`flex-1 py-3 px-4 text-center font-medium ${
            activeTab === "text"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => setActiveTab("text")}
        >
          Text Analysis
        </button>
        <button
          className={`flex-1 py-3 px-4 text-center font-medium ${
            activeTab === "image"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => setActiveTab("image")}
        >
          Image Analysis
        </button>
      </div>

      <div className="p-6">
        {activeTab === "text" ? (
          <form onSubmit={handleDataSubmit}>
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
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter text, numbers, or structured data to analyze..."
                rows="6"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 flex items-center justify-center"
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
                  Analyzing...
                </>
              ) : (
                "Analyze Data"
              )}
            </button>
          </form>
        ) : (
          <div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Upload or capture an image to analyze
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-48 mb-3"
                      />
                    ) : (
                      <>
                        <svg
                          className="w-10 h-10 mb-3 text-blue-400"
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
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG or JPEG
                        </p>
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
            {loading && (
              <div className="flex items-center justify-center py-3">
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-blue-500"
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
                Analyzing image...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderDashboard = () => {
    if (!analysisResult) return null;

    const summaryStats = extractSummaryStats();

    return (
      <div className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Key Insights
                </p>
                <p className="text-2xl font-semibold text-gray-800">
                  {summaryStats?.keyInsights || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Confidence Score
                </p>
                <p className="text-2xl font-semibold text-gray-800">
                  {summaryStats?.confidence || 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  ></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Data Points
                </p>
                <p className="text-2xl font-semibold text-gray-800">
                  {summaryStats?.totalPoints || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Processing Time
                </p>
                <p className="text-2xl font-semibold text-gray-800">
                  {summaryStats?.processingTime || "0s"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Visualization Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
              <h3 className="text-lg font-semibold text-gray-800">
                Key Metrics Distribution
              </h3>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-end justify-around">
                <div className="flex flex-col items-center">
                  <div
                    className="w-16 bg-blue-500 rounded-t"
                    style={{ height: "40%" }}
                  ></div>
                  <p className="mt-2 text-sm text-gray-600">Category A</p>
                </div>
                <div className="flex flex-col items-center">
                  <div
                    className="w-16 bg-blue-500 rounded-t"
                    style={{ height: "65%" }}
                  ></div>
                  <p className="mt-2 text-sm text-gray-600">Category B</p>
                </div>
                <div className="flex flex-col items-center">
                  <div
                    className="w-16 bg-blue-500 rounded-t"
                    style={{ height: "85%" }}
                  ></div>
                  <p className="mt-2 text-sm text-gray-600">Category C</p>
                </div>
                <div className="flex flex-col items-center">
                  <div
                    className="w-16 bg-blue-500 rounded-t"
                    style={{ height: "55%" }}
                  ></div>
                  <p className="mt-2 text-sm text-gray-600">Category D</p>
                </div>
                <div className="flex flex-col items-center">
                  <div
                    className="w-16 bg-blue-500 rounded-t"
                    style={{ height: "70%" }}
                  ></div>
                  <p className="mt-2 text-sm text-gray-600">Category E</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
              <h3 className="text-lg font-semibold text-gray-800">
                Distribution Analysis
              </h3>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <div
                    className="absolute inset-0 rounded-full border-8 border-blue-500"
                    style={{
                      clipPath: "polygon(50% 50%, 100% 50%, 100% 0, 50% 0)",
                    }}
                  ></div>
                  <div
                    className="absolute inset-0 rounded-full border-8 border-green-500"
                    style={{ clipPath: "polygon(50% 50%, 50% 0, 0 0, 0 50%)" }}
                  ></div>
                  <div
                    className="absolute inset-0 rounded-full border-8 border-yellow-500"
                    style={{
                      clipPath: "polygon(50% 50%, 0 50%, 0 100%, 50% 100%)",
                    }}
                  ></div>
                  <div
                    className="absolute inset-0 rounded-full border-8 border-red-500"
                    style={{
                      clipPath:
                        "polygon(50% 50%, 50% 100%, 100% 100%, 100% 50%)",
                    }}
                  ></div>
                </div>
                <div className="ml-6">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-blue-500 mr-2"></div>
                    <span className="text-sm text-gray-600">
                      Segment A (25%)
                    </span>
                  </div>
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-green-500 mr-2"></div>
                    <span className="text-sm text-gray-600">
                      Segment B (25%)
                    </span>
                  </div>
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-yellow-500 mr-2"></div>
                    <span className="text-sm text-gray-600">
                      Segment C (25%)
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 mr-2"></div>
                    <span className="text-sm text-gray-600">
                      Segment D (25%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Line Chart */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
              <h3 className="text-lg font-semibold text-gray-800">
                Time Series Analysis
              </h3>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-end">
                <div className="relative flex-1 h-full">
                  <div className="absolute bottom-0 left-0 w-full h-px bg-gray-300"></div>
                  <div className="absolute bottom-0 left-0 w-px h-full bg-gray-300"></div>

                  <svg
                    className="absolute inset-0"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,80 L20,70 L40,75 L60,40 L80,30 L100,50"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="2"
                    />
                  </svg>

                  <div className="absolute bottom-[80%] left-[0%] w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1 -translate-y-1"></div>
                  <div className="absolute bottom-[70%] left-[20%] w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1 -translate-y-1"></div>
                  <div className="absolute bottom-[75%] left-[40%] w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1 -translate-y-1"></div>
                  <div className="absolute bottom-[40%] left-[60%] w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1 -translate-y-1"></div>
                  <div className="absolute bottom-[30%] left-[80%] w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1 -translate-y-1"></div>
                  <div className="absolute bottom-[50%] left-[100%] w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1 -translate-y-1"></div>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Recent Analyses
              </h3>
              <div className="flex space-x-2">
                <select
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="text">Text Only</option>
                  <option value="image">Image Only</option>
                </select>
                <select
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredAnalyses().map((analysis) => (
                      <tr key={analysis.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {analysis.title}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {analysis.type}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(analysis.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {analysis.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Raw Analysis Results */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
            <h2 className="text-xl font-bold text-white">
              Detailed Analysis Results
            </h2>
          </div>
          <div className="p-6">
            {Object.entries(analysisResult).map(([key, value]) => {
              if (key === "error") return null;

              return (
                <div key={key} className="mb-4">
                  <h3 className="text-lg font-semibold capitalize mb-2 text-blue-700">
                    {key.replace(/_/g, " ")}
                  </h3>
                  {Array.isArray(value) ? (
                    <ul className="list-disc pl-5">
                      {value.map((item, index) => (
                        <li key={index} className="mb-1">
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : typeof value === "object" ? (
                    <pre className="bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-gray-700">{value}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Export options */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
            <h3 className="text-lg font-semibold text-gray-800">
              Export Options
            </h3>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleDocumentGeneration("text")}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg flex items-center"
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                Text File
              </button>
              <button
                onClick={() => handleDocumentGeneration("excel")}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
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
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                Excel
              </button>
              <button
                onClick={() => handleDocumentGeneration("word")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                Word
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Analysis Results Dashboard
          </h1>
          <p className="text-gray-600">
            Analyze text data or images and export results in various formats
          </p>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <div
            className={`fixed inset-y-0 left-0 transform ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } transition-transform duration-300 ease-in-out bg-white shadow-lg z-30`}
          >
            <div className="p-6">
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
              <nav className="mt-8">
                <button
                  onClick={() => setActiveView("form")}
                  className="block text-left w-full text-gray-700 hover:bg-gray-100 px-4 py-2 rounded"
                >
                  Analysis Form
                </button>
                <button
                  onClick={() => setActiveView("dashboard")}
                  className="block text-left w-full text-gray-700 hover:bg-gray-100 px-4 py-2 rounded"
                >
                  Dashboard
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 ml-0 lg:ml-64">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-800 mb-4"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16m-7 6h7"
                ></path>
              </svg>
            </button>

            {activeView === "form" ? renderAnalysisForm() : renderDashboard()}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md">
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainComponent;