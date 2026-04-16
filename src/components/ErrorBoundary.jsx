import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-sm">
          <p className="font-bold text-red-700 mb-2">Fehler in diesem Tab</p>
          <pre className="text-xs text-red-600 whitespace-pre-wrap font-mono bg-white p-3 rounded border border-red-100 max-h-48 overflow-auto">
            {this.state.error.message}
            {"\n"}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-3 px-3 py-1.5 bg-red-100 border border-red-200 text-red-700 rounded text-xs font-semibold hover:bg-red-200"
          >
            Erneut versuchen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
