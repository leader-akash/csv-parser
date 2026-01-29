"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getResults } from "@/lib/indexedDB";

const ITEMS_PER_PAGE = 50;

export default function ResultsPage() {
  const [data, setData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorFilter, setErrorFilter] = useState("all");
  const router = useRouter();

  useEffect(() => {
    const loadResults = async () => {
      try {
        // Load results from IndexedDB (supports large datasets)
        const results = await getResults();
        if (!results) {
          router.push("/");
          return;
        }
        setData(results);
      } catch (error) {
        console.error("Failed to load results:", error);
        router.push("/");
      }
    };
    loadResults();
  }, [router]);

  const errorTypes = useMemo(() => {
    if (!data?.failedRecords) return [];
    const types = new Set();
    data.failedRecords.forEach((record) => {
      record.errors.forEach((error) => {
        if (error.toLowerCase().includes("name")) types.add("name");
        if (error.toLowerCase().includes("email")) types.add("email");
        if (error.toLowerCase().includes("phone")) types.add("phone");
      });
    });
    return Array.from(types);
  }, [data]);

  const filteredRecords = useMemo(() => {
    if (!data?.failedRecords) return [];
    
    let records = [...data.failedRecords];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      records = records.filter(
        (record) =>
          record.name?.toLowerCase().includes(query) ||
          record.email?.toLowerCase().includes(query) ||
          record.phone?.toString().includes(query) ||
          record.errors.some((e) => e.toLowerCase().includes(query))
      );
    }

    if (errorFilter !== "all") {
      records = records.filter((record) =>
        record.errors.some((e) => e.toLowerCase().includes(errorFilter))
      );
    }

    return records;
  }, [data, searchQuery, errorFilter]);

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, errorFilter]);

  const downloadCSV = () => {
    if (!filteredRecords.length) return;

    const headers = ["Row", "Name", "Email", "Phone", "Errors"];
    const rows = filteredRecords.map((record) => [
      record.rowNumber,
      record.name || "",
      record.email || "",
      record.phone || "",
      record.errors.join("; "),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "failed_records.csv";
    link.click();
  };

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="loader" />
      </main>
    );
  }

  const successRate = ((data.validCount / data.totalRecords) * 100).toFixed(1);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Validation Results</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              CSV file processed successfully
            </p>
          </div>
          <Link
            href="/"
            className="btn-primary inline-flex items-center gap-2 w-fit"
          >
            <svg
              className="w-4 h-4"
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
            Upload New File
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Total Records
            </p>
            <p className="text-3xl font-bold">{data.totalRecords.toLocaleString()}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Valid Records
            </p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {data.validCount.toLocaleString()}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Invalid Records
            </p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {data.invalidCount.toLocaleString()}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Success Rate
            </p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {successRate}%
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold">
              Failed Records ({filteredRecords.length.toLocaleString()})
            </h2>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full md:w-64"
                />
              </div>
              <select
                value={errorFilter}
                onChange={(e) => setErrorFilter(e.target.value)}
                className="w-full md:w-auto"
              >
                <option value="all">All Errors</option>
                {errorTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)} Errors
                  </option>
                ))}
              </select>
              <button
                onClick={downloadCSV}
                disabled={!filteredRecords.length}
                className="btn-primary flex items-center gap-2 justify-center"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download CSV
              </button>
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {data.invalidCount === 0
                ? "All records are valid!"
                : "No records match your search criteria"}
            </div>
          ) : (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.map((record) => (
                      <tr key={record.rowNumber}>
                        <td className="font-mono text-sm">{record.rowNumber}</td>
                        <td>{record.name || <span className="text-gray-400">(empty)</span>}</td>
                        <td>{record.email || <span className="text-gray-400">(empty)</span>}</td>
                        <td className="font-mono">{record.phone || <span className="text-gray-400">(empty)</span>}</td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {record.errors.map((error, idx) => (
                              <span key={idx} className="error-badge">
                                {error}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredRecords.length)} of{" "}
                    {filteredRecords.length.toLocaleString()} records
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="First page"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Previous page"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <div className="flex items-center gap-1">
                      {generatePageNumbers(currentPage, totalPages).map((page, idx) =>
                        page === "..." ? (
                          <span key={`ellipsis-${idx}`} className="px-2">
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === page
                                ? "bg-blue-500 text-white"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Next page"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Last page"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 5l7 7-7 7M5 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function generatePageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [];
  
  pages.push(1);

  if (current > 3) {
    pages.push("...");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  if (current < total - 2) {
    pages.push("...");
  }

  if (!pages.includes(total)) {
    pages.push(total);
  }

  return pages;
}
