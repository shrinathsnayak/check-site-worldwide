/**
 * Utility functions for form handling
 */

/**
 * Encodes a URL parameter for use in query strings
 */
export function encodeUrlParam(url: string): string {
  return encodeURIComponent(url);
}

/**
 * Creates a results URL with the given URL parameter
 */
export function createResultsUrl(url: string): string {
  const urlParam = encodeUrlParam(url);
  return `/results?url=${urlParam}`;
}

/**
 * Form validation utilities
 */
export const formValidation = {
  /**
   * Validates a URL field and returns an error message or null
   */
  url: (
    value: string,
    validateUrl: (url: string) => boolean
  ): string | null => {
    return validateUrl(value) ? null : 'Invalid URL';
  },
};

/**
 * Default form values
 */
export const defaultFormValues = {
  url: '',
} as const;
