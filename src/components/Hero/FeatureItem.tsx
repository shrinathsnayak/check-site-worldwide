import { Text, rem } from '@mantine/core';

import type { FeatureItemProps } from '@/types/component-types';

export default function FeatureItem({ text, isSeparator = false }: FeatureItemProps) {
  return (
    <Text
      c='red.7'
      ta='center'
      fw='500'
      fz={{ base: rem(14), sm: rem(16) }}
    >
      {text}
    </Text>
  );
}
