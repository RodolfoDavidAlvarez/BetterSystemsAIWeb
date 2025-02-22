
import { Routes, Route } from 'react-router-dom';
import AIConsultingPage from './pages/services/AIConsultingPage';

function App() {
  return (
    <Routes>
      <Route path="/services/ai-consulting" element={<AIConsultingPage />} />
      {/* other routes */}
    </Routes>
  );
}

export default App;
