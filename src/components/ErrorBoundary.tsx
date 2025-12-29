import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/Button';

/**
 * UX4G Error Boundary Component
 * Catches JavaScript errors and displays fallback UI
 * 
 * Compliant with Government of India Design System v2.0.8
 */

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
                    <div className="card shadow-lg border-danger" style={{ maxWidth: '600px', width: '100%' }}>
                        <div className="card-body p-5">
                            <div className="d-flex align-items-center gap-3 mb-4">
                                <div className="p-3 bg-danger bg-opacity-10 rounded-circle">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="32"
                                        height="32"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="text-danger"
                                    >
                                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                        <path d="M12 9v4" />
                                        <path d="M12 17h.01" />
                                    </svg>
                                </div>
                                <h1 className="h4 fw-bold mb-0">Something went wrong</h1>
                            </div>

                            <p className="text-muted mb-4">
                                The application encountered an unexpected error. Please report this to the development team.
                            </p>

                            {this.state.error && (
                                <div className="bg-dark rounded p-3 mb-4 overflow-auto">
                                    <p className="text-danger font-monospace small fw-bold mb-2">
                                        {this.state.error.toString()}
                                    </p>
                                    <pre className="text-secondary font-monospace small mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                                        {this.state.errorInfo?.componentStack || this.state.error.stack}
                                    </pre>
                                </div>
                            )}

                            <div className="d-flex gap-3">
                                <Button
                                    variant="primary"
                                    onClick={() => window.location.href = '/'}
                                >
                                    Return Home
                                </Button>
                                <Button
                                    variant="outline-primary"
                                    onClick={() => window.location.reload()}
                                >
                                    Reload Page
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
