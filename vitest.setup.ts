import '@testing-library/jest-dom';

// Mock scrollIntoView for jsdom
if (typeof window !== 'undefined') {
  Element.prototype.scrollIntoView = function(_options?: ScrollIntoViewOptions) {};
}