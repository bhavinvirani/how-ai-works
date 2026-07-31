import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/**
 * React Testing Library only registers its own cleanup when a global
 * `afterEach` exists, and we run with `globals: false` to keep imports
 * explicit. Without this, a second test rendering the same component meets the
 * first one's leftover DOM and fails with "found multiple elements".
 */
afterEach(() => {
  cleanup();
});
