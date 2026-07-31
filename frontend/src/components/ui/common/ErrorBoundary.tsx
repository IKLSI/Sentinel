import React from "react";
import { ErrorPage } from "@/pages/ErrorPage";

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorPage status={500} onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}
