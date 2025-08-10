import { Flex, Text } from '@mantine/core';
import { ALL_COUNTRIES } from '@/utils/countries';

const CountriesBadge = () => {
  return (
    <Flex
      p={2}
      mb={20}
      gap={8}
      px={16}
      bg='dark.7'
      align='center'
      justify='space-between'
      w='fit-content'
      style={{
        borderRadius: 'var(--mantine-radius-xl)',
        boxShadow: 'var(--mantine-shadow-xl)',
        border: '1px solid var(--mantine-color-red-9)',
      }}
    >
      <Text c='white' fz='xs' fw='bold'>
        🌍
      </Text>
      <Text c='white' fz='sm' fw='500'>
        {ALL_COUNTRIES.length} Supported Countries
      </Text>
    </Flex>
  );
};

export default CountriesBadge;
