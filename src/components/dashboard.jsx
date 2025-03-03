import React from "react";
import { Link, Routes, Route } from "react-router-dom";
import Overview from "./Overview";
import CreateTest from "./Create_test";
import ViewResults from "./ViewResults";
import Settings from "./Setting";
import Account from "./Account";

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-gray-200">
      {/* Sidebar */}
      <div className="w-1/4 bg-white shadow-lg">
        <div className="p-4">
          <div className="flex items-center space-x-4">
            <img
              src="https://via.placeholder.com/50"
              alt="Profile"
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h2 className="text-lg font-semibold">Account Holder</h2>
              <p className="text-gray-600">email@example.com</p>
            </div>
          </div>
          <nav className="mt-8">
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="text-blue-500 hover:underline">
                  Overview
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/tests"
                  className="text-blue-500 hover:underline"
                >
                  Tests
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/view-results"
                  className="text-blue-500 hover:underline"
                >
                  View Results
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/settings"
                  className="text-blue-500 hover:underline"
                >
                  Settings
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/account"
                  className="text-blue-500 hover:underline"
                >
                  Account
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/tests" element={<CreateTest />} />
          <Route path="/view-results" element={<ViewResults />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/account" element={<Account />} />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
