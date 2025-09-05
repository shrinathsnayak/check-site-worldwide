import { UseFormReturnType } from '@mantine/form';

/**
 * Form submission handler type
 */
export type FormSubmissionHandler = (values: {
  url: string;
}) => Promise<void> | void;

/**
 * Form input component props
 */
export interface FormInputProps {
  form: UseFormReturnType<{ url: string }>;
  isSmUp: boolean;
  disabled?: boolean;
}

/**
 * Submit button component props
 */
export interface SubmitButtonProps {
  isLoading?: boolean;
  fullWidth?: boolean;
}

/**
 * Form validation result type
 */
export type FormValidationResult = string | null;
