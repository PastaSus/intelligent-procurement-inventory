import '@testing-library/jest-dom';

// Mock scrollIntoView for jsdom
if (typeof window !== 'undefined') {
  Element.prototype.scrollIntoView = function(_options?: ScrollIntoViewOptions) {};
  Element.prototype.hasPointerCapture = function(_pointerId: number) { return false; };
}

// jsdom does not implement layout observers used by the print preview scaler
if (typeof window !== 'undefined' && typeof window.ResizeObserver === 'undefined') {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
}

// jsdom does not implement object URLs used by the download helpers
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => 'blob:vitest';
  URL.revokeObjectURL = () => {};
}
