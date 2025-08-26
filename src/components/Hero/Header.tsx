import { Flex, rem, Title, Group } from '@mantine/core';
import CountriesBadge from './CountriesBadge';
import FeatureItem from './FeatureItem';
import { getHeroFeatureItems } from '@/utils/hero-utils';

const Header = () => {
  const featureItems = getHeroFeatureItems();

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
        {featureItems.map((item, index) => (
          <FeatureItem
            key={index}
            text={item.text}
            isSeparator={item.isSeparator}
          />
        ))}
      </Group>
    </Flex>
  );
};

export default Header;
