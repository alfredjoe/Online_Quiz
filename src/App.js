import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import "./index.css"; // ✅ Import Tailwind styles

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Signup />} /> {/* Default route */}
      </Routes>
    </Router>
  );
}


export default App;
