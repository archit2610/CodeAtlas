import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';

import ChatApp from './pages/ChatApp';
import { ROUTES } from './lib/constants';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
          <Routes>
            <Route path={ROUTES.HOME} element={<ChatApp />} />
            <Route path={ROUTES.DASHBOARD} element={<ChatApp />} />
            <Route path={ROUTES.CONVERSATION} element={<ChatApp />} />
            <Route path={ROUTES.REPORT} element={<ChatApp />} />

            <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
