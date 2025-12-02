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

// Placeholder home page
import { HomePage } from './pages/HomePage';

function App() {
  return (
    <BrowserRouter>
      {/* CRITICAL LEGAL COMPONENTS */}
      <DisclaimerModal />
      <PrototypeWatermark />

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Tricolor bar at top */}
        <div className="tricolor-bar h-1"></div>

        {/* Non-dismissible disclaimer banner */}
        <DisclaimerBanner />

        {/* Header with PROTOTYPE badges */}
        <Header />

        {/* Breadcrumb navigation */}
        <Breadcrumbs />

        {/* Main content */}
        <main className="flex-1">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/results/:jobId" element={<ResultsPage />} /> {/* Added ResultsPage route */}
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
