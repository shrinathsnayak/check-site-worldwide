'use client';

import { TextInput } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import SubmitButton from './SubmitButton';
import classes from './style.module.css';

import type { FormInputProps } from '@/types/form-types';

export default function FormInput({ form, isSmUp, disabled = false }: FormInputProps) {
  return (
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
      disabled={disabled}
      {...form.getInputProps('url')}
    />
  );
}
