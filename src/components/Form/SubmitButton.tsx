'use client';

import { Button } from '@mantine/core';

interface SubmitButtonProps {
  isLoading?: boolean;
  fullWidth?: boolean;
}

const SubmitButton = ({
  isLoading = false,
  fullWidth = false,
}: SubmitButtonProps) => {
  return (
    <Button
      radius='sm'
      mr={fullWidth ? 0 : 10}
      color='red.9'
      type='submit'
      loading={isLoading}
      disabled={isLoading}
      fullWidth={fullWidth}
    >
      {isLoading ? 'Checking...' : 'Check Website'}
    </Button>
  );
};

export default SubmitButton;
