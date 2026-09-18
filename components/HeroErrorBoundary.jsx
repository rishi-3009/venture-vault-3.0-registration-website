"use client";

import { Component } from "react";
import HeroFallback from "./HeroFallback";

// A crash in the particle animation must never take the page down with it —
// this catches render/lifecycle errors from ParticleCanvas and swaps in the
// plain CSS fallback instead.
export default class HeroErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Hero particle animation crashed, using static fallback:", error);
  }

  render() {
    if (this.state.hasError) {
      return <HeroFallback progressRef={this.props.progressRef} active={this.props.active} />;
    }
    return this.props.children;
  }
}
