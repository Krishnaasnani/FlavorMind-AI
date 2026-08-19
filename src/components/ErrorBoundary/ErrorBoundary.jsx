import React from "react";
import PropTypes from "prop-types";
import styles from "./ErrorBoundary.module.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Keep diagnostics available during development without exposing them in the UI.
    console.error("RecipeFinder UI error", error);
  }

  render() {
    if (this.state.hasError) {
      return <section className={styles.error} role="alert"><span aria-hidden="true">🍳</span><h1>Something went wrong</h1><p>Our kitchen hit a snag. Please try loading this page again.</p><button type="button" onClick={() => this.setState({ hasError: false })}>Try again</button></section>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};
