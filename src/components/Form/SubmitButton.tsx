'use client';

import { Button } from '@mantine/core';

interface SubmitButtonProps {
  isLoading?: boolean;
}

const SubmitButton = ({ isLoading = false }: SubmitButtonProps) => {
  return (
    <Button
      radius='sm'
      mr={10}
      color='red.9'
      type='submit'
      loading={isLoading}
      disabled={isLoading}
    >
      {isLoading ? 'Checking...' : 'Check Website'}
    </Button>
  );
};

export default SubmitButton;
