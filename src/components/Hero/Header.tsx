import { Flex, rem, Title, Text, Group } from '@mantine/core';
import CountriesBadge from './CountriesBadge';

const Feature = ({ text }: { text: string }) => {
  return (
    <Text c='red.7' ta='center' fw='500' fz={{ base: rem(14), sm: rem(16) }}>
      {text}
    </Text>
  );
};

const Header = () => {
  return (
    <Flex
      mt={{ base: rem(55), sm: rem(70) }}
      direction='column'
      align='center'
      gap={rem(10)}
    >
      <CountriesBadge />
      <Title
        fz={{ base: rem(40), sm: rem(50) }}
        c='white'
        order={1}
        mb={20}
        ta='center'
      >
        Test Your Website&apos;s Global Reach
      </Title>

      <Title
        c='white'
        ta='center'
        fw='400'
        maw={{ base: '100%', sm: '70%' }}
        lh={1.9}
        order={4}
        fz={{ base: rem(14), sm: rem(16) }}
      >
        Check your website&apos;s global accessibility in seconds. Find and fix
        regional access issues before they impact your users.
      </Title>

      <Group gap={10} align='center' mt={10}>
        <Feature text='Global Coverage' />
        <Feature text='&#x2022;' />
        <Feature text='Instant Results' />
        <Feature text='&#x2022;' />
        <Feature text='Real Proxies' />
      </Group>
    </Flex>
  );
};

export default Header;
