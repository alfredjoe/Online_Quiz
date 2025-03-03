import React from "react";

const ViewResults = () => {
  const results = [
    { studentName: "John Doe", testName: "Math Test", score: "85%" },
    // Add more sample results here
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">View Results</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Student Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Test Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Score
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {results.map((result, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap">
                {result.studentName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{result.testName}</td>
              <td className="px-6 py-4 whitespace-nowrap">{result.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViewResults;
