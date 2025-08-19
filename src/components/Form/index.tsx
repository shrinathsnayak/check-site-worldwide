'use client';

import { useRouter } from 'next/navigation';
import { Flex, TextInput, Box, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useForm } from '@mantine/form';

// Components Imports
import SubmitButton from './SubmitButton';
import classes from './style.module.css';
import { validateUrl } from '@/validation/validation';

const Form = () => {
  const router = useRouter();
  const theme = useMantineTheme();
  const isSmUp = useMediaQuery(`(min-width: ${theme.breakpoints.sm})`);

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
    // Always use streaming mode
    router.push(`/results?url=${urlParam}&stream=true`);
  };

  return (
    <Box>
      <form onSubmit={form.onSubmit(values => handleFormSubmission(values))}>
        <Flex
          align='center'
          justify='center'
          w='100%'
          direction={{ base: 'column', sm: 'row' }}
          gap={{ base: 'sm', sm: 0 }}
        >
          <TextInput
            size='lg'
            radius='md'
            type='url'
            w={{ base: '100%', sm: '70%' }}
            placeholder='Enter your website URL with https://'
            classNames={{
              section: classes.section,
              input: classes.input,
              wrapper: classes.inputWrapper,
            }}
            rightSection={
              isSmUp ? (
                <div className={classes.desktopButton}>
                  <SubmitButton />
                </div>
              ) : undefined
            }
            rightSectionPointerEvents='auto'
            key={form.key('url')}
            disabled={false}
            {...form.getInputProps('url')}
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
