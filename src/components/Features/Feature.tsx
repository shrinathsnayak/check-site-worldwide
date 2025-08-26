import { Box, Center, ThemeIcon, Text } from '@mantine/core';
import type { FeatureProps } from '@/types/types';

export default function Feature({ icon: Icon, title, description }: FeatureProps) {
  return (
    <Box maw={{ base: '100%', sm: '350px' }}>
      <Center>
        <ThemeIcon variant='light' color='red' size={45} radius={40}>
          <Icon size={20} stroke={2} />
        </ThemeIcon>
      </Center>
      <Text mt='lg' mb={7} ta='center' c='white' fw='500'>
        {title}
      </Text>
      <Text size='md' c='dimmed' lh={1.6} ta='center'>
        {description}
      </Text>
    </Box>
  );
}
