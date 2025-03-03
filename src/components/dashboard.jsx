import React from "react";
import CreateTest from "./CreateTest";
import ViewResults from "./ViewResults";

const Dashboard = () => {
  return (
    <div className="container mx-auto p-4">
      <header className="text-center my-8">
        <h1 className="text-4xl font-bold">Teacher Dashboard</h1>
      </header>
      <nav className="mb-8">
        <ul className="flex justify-center space-x-4">
          <li>
            <a href="#create-test" className="text-blue-500 hover:underline">
              Create Test
            </a>
          </li>
          <li>
            <a href="#view-results" className="text-blue-500 hover:underline">
              View Results
            </a>
          </li>
        </ul>
      </nav>
      <main className="flex justify-around">
        <section id="create-test" className="w-1/2">
          <CreateTest />
        </section>
        <section id="view-results" className="w-1/2">
          <ViewResults />
        </section>
      </main>
      <footer className="text-center py-4">
        <p>© 2025 Teacher Dashboard</p>
      </footer>
    </div>
  );
};

export default Dashboard;
