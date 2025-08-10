'use client';

import { useRouter } from 'next/navigation';
import { Flex, TextInput, Box } from '@mantine/core';
import { useForm } from '@mantine/form';

// Components Imports
import SubmitButton from './SubmitButton';
import classes from './style.module.css';
import { validateUrl } from '@/validation/validation';

const Form = () => {
  const router = useRouter();

  const form = useForm({
    initialValues: {
      url: '',
    },

    validate: {
      url: value => (validateUrl(value) ? null : 'Invalid URL'),
    },
  });

  const handleFormSubmission = async (values: { url: string }) => {
    const urlParam = encodeURIComponent(values.url);
    router.push(`/results?url=${urlParam}`);
  };

  return (
    <Box>
      <form onSubmit={form.onSubmit(values => handleFormSubmission(values))}>
        <Flex align='center' justify='center' w='100%'>
          <TextInput
            size='lg'
            radius='md'
            w={{ base: '100%', sm: '70%' }}
            placeholder='Enter your website URL with https://'
            classNames={{ section: classes.section, input: classes.input }}
            rightSection={<SubmitButton />}
            rightSectionPointerEvents='auto'
            key={form.key('url')}
            disabled={false}
            {...form.getInputProps('url')}
          />
        </Flex>
      </form>
    </Box>
  );
};

export default Form;
