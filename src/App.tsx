import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { DisclaimerModal } from './components/DisclaimerModal';
import { PrototypeWatermark } from './components/PrototypeWatermark';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Breadcrumbs } from './components/Breadcrumbs';
import { UploadPage } from './pages/UploadPage';
import { ResultsPage } from './pages/ResultsPage';
import { AboutPage } from './pages/AboutPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { DisclaimerPage } from './pages/DisclaimerPage';
import ReviewPage from './pages/ReviewPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './pages/HomePage';

/**
 * Main App Component
 * UX4G Design System v2.0.8 Compliant Layout
 */
function App() {
  return (
    <BrowserRouter>
      {/* CRITICAL LEGAL COMPONENTS */}
      <DisclaimerModal />
      <PrototypeWatermark />

      {/* Main Layout - UX4G Structure */}
      <div className="d-flex flex-column min-vh-100 bg-light">
        {/* Non-dismissible disclaimer banner */}
        <DisclaimerBanner />

        {/* Header with UX4G Navbar */}
        <Header />

        {/* Breadcrumb navigation */}
        <Breadcrumbs />

        {/* Main content area */}
        <main className="flex-grow-1">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/results/:jobId" element={<ResultsPage />} />
              <Route path="/review" element={<ReviewPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/disclaimer" element={<DisclaimerPage />} />
            </Routes>
          </ErrorBoundary>
        </main>

        {/* Legal footer */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
