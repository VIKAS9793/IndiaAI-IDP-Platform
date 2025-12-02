import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';

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
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8 border border-red-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertTriangle className="h-8 w-8 text-red-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
                        </div>

                        <p className="text-gray-600 mb-6">
                            The application encountered an unexpected error. Please report this to the development team.
                        </p>

                        {this.state.error && (
                            <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
                                <p className="text-red-400 font-mono text-sm font-bold mb-2">
                                    {this.state.error.toString()}
                                </p>
                                <pre className="text-gray-400 font-mono text-xs whitespace-pre-wrap">
                                    {this.state.errorInfo?.componentStack || this.state.error.stack}
                                </pre>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <Button
                                variant="primary"
                                onClick={() => window.location.href = '/'}
                            >
                                Return Home
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => window.location.reload()}
                            >
                                Reload Page
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
