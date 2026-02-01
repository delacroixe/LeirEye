// Vitest + @testing-library/jest-dom setup
// Provides custom matchers for asserting on DOM nodes
// Example: expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Make jest-style mocks and functions available globally
global.jest = vi;

