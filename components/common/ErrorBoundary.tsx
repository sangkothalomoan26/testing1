import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  // Fix: Initialize state as a class property to ensure `this` context is correctly set up.
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    // Fix: `this.setState` is now available due to correct class setup.
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex items-center justify-center min-h-screen bg-light-bg dark:bg-dark-bg p-4">
            <div className="w-full max-w-2xl p-8 bg-red-100 dark:bg-red-900/20 border border-red-500 rounded-lg shadow-lg text-red-800 dark:text-red-200">
                <h1 className="text-2xl font-bold mb-4">Oops! Terjadi Kesalahan.</h1>
                <p className="mb-4">Aplikasi mengalami error yang tidak terduga. Ini mungkin disebabkan oleh masalah data atau bug. Silakan coba muat ulang halaman.</p>
                <details className="bg-red-200 dark:bg-navy-800 p-4 rounded-md cursor-pointer">
                    <summary className="font-semibold outline-none">Detail Error Teknis</summary>
                    <pre className="mt-2 text-xs whitespace-pre-wrap overflow-auto" style={{ fontFamily: 'monospace' }}>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                </details>
            </div>
        </div>
      );
    }

    // Fix: `this.props` is now available due to correct class setup.
    return this.props.children;
  }
}

export default ErrorBoundary;