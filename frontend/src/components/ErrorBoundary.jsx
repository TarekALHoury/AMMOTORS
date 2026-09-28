import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('AM MOTORS interface error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="state-page page-content" role="alert">
          <p className="eyebrow">Something went wrong</p>
          <h1>We couldn’t display this page</h1>
          <p>Please reload the page and try again.</p>
          <button className="button button-primary" type="button" onClick={() => window.location.reload()}>Reload page</button>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
