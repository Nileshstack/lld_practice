import { Navigate, Route, Routes } from 'react-router-dom';
import FeedbackView from './FeedbackView';
import ProblemDetail from './ProblemDetail';
import ProblemList from './ProblemList';

function App() {
  return (
    <main>
      <Routes>
        <Route path="/problems" element={<ProblemList />} />
        <Route path="/problems/:id" element={<ProblemDetail />} />
        <Route path="/attempts/:id/feedback" element={<FeedbackView />} />
        <Route path="*" element={<Navigate to="/problems" replace />} />
      </Routes>
    </main>
  );
}

export default App;
