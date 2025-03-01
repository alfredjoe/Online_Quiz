import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import "./index.css"; // ✅ Import Tailwind styles
import Home from "./components/home";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<Home />}/>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}


export default App;
