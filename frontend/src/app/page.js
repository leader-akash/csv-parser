"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveResults } from "@/lib/indexedDB";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  const router = useRouter();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError("");
    
    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!selectedFile.name.endsWith(".csv")) {
      setError("Please select a valid CSV file");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    
    if (!droppedFile) return;

    if (!droppedFile.name.endsWith(".csv")) {
      setError("Please drop a valid CSV file");
      return;
    }

    setFile(droppedFile);
    setError("");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setProgress(percent);
        }
      });

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            try {
              // Use IndexedDB for large data storage (no quota limits like sessionStorage)
              await saveResults(response.data);
              router.push("/results");
            } catch (dbError) {
              console.error("Failed to save results:", dbError);
              setError("Failed to store results. Please try again.");
              setUploading(false);
            }
          } else {
            setError(response.message || "Upload failed");
            setUploading(false);
          }
        } else {
          const response = JSON.parse(xhr.responseText);
          setError(response.message || "Upload failed");
          setUploading(false);
        }
      };

      xhr.onerror = () => {
        setError("Network error. Please check if the server is running.");
        setUploading(false);
      };

      xhr.open("POST", "http://localhost:5000/api/upload");
      xhr.send(formData);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">CSV Validator</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Upload your CSV file to validate records
          </p>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            file
              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="file-input"
          />

          {file ? (
            <div>
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="font-medium mb-1">{file.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(file.size)}
              </p>
              <button
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="mt-3 text-sm text-red-500 hover:text-red-600"
              >
                Remove file
              </button>
            </div>
          ) : (
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="font-medium mb-1">
                Drop your CSV file here or click to browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Supports files with 10,000+ rows
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Max file size: 1000MB
              </p>
            </label>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {uploading && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Uploading...</span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress === 100 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Processing file... This may take a moment for large files.
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="btn-primary w-full mt-6"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            "Upload & Validate"
          )}
        </button>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium mb-3">Validation Rules</h3>
          <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>
                <strong>Name:</strong> Required, min 2 characters, no special
                characters
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>
                <strong>Email:</strong> Required, valid format, no disposable
                domains
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>
                <strong>Phone:</strong> Required, exactly 10 digits, must start
                with 6/7/8/9
              </span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
