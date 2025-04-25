import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Main from "./components/Main";
import Thanks from "./components/Last";
import TermsAndConditions from "./components/Terms";
import PrivacyPolicy from "./components/Privacy";
import Phone from "./components/Phone";

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/thanks" element={<Thanks />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/phone" element={<Phone />} />
          {/* Catch-all route for undefined paths */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;