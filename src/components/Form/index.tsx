'use client';

import { useRouter } from 'next/navigation';
import { Flex, Box, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useForm } from '@mantine/form';

// Components Imports
import SubmitButton from './SubmitButton';
import FormInput from './FormInput';
import classes from './style.module.css';
import { validateUrl } from '@/validation/validation';
import {
  createResultsUrl,
  formValidation,
  defaultFormValues
} from '@/utils/form-utils';
import type { FormSubmissionHandler } from '@/types/form-types';

const Form = () => {
  const router = useRouter();
  const theme = useMantineTheme();
  const isSmUp = useMediaQuery(`(min-width: ${theme.breakpoints.sm})`);

  const form = useForm({
    initialValues: defaultFormValues,
    validate: {
      url: value => formValidation.url(value, validateUrl),
    },
  });

  const handleFormSubmission: FormSubmissionHandler = async (values) => {
    const resultsUrl = createResultsUrl(values.url);
    router.push(resultsUrl);
  };

  return (
    <Box>
      <form onSubmit={form.onSubmit(handleFormSubmission)}>
        <Flex
          align='center'
          justify='center'
          w='100%'
          direction={{ base: 'column', sm: 'row' }}
          gap={{ base: 'sm', sm: 0 }}
        >
          <FormInput
            form={form}
            isSmUp={isSmUp}
            disabled={false}
          />
          <div className={classes.mobileButton}>
            <SubmitButton fullWidth />
          </div>
        </Flex>
      </form>
    </Box>
  );
};

export default Form;
