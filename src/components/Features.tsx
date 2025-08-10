import {
  IconGlobe,
  IconClock,
  IconShield,
  IconCode,
} from '@tabler/icons-react';
import {
  Box,
  Center,
  Container,
  SimpleGrid,
  Text,
  ThemeIcon,
  Title,
  rem,
} from '@mantine/core';
import { getCountryAndContinentCounts } from '@/utils/utils';
import { FeatureProps } from '@/types/types';

const { countryCount, continentCount } = getCountryAndContinentCounts();

export const DISPLAY_DATA = [
  {
    icon: IconGlobe,
    title: 'Global Coverage',
    description: `Test from ${countryCount} countries across ${continentCount} continents. Comprehensive regional testing worldwide.`,
  },
  {
    icon: IconClock,
    title: 'Instant Results',
    description:
      'Parallel testing delivers results in seconds with smart caching.',
  },
  {
    icon: IconShield,
    title: 'Premium Proxies',
    description: "Real IP addresses from Webshare's premium proxy network.",
  },
  {
    icon: IconCode,
    title: 'Detailed Analytics',
    description:
      'Get comprehensive reports with response times, status codes, and regional insights.',
  },
];

export function Feature({ icon: Icon, title, description }: FeatureProps) {
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

const Features = () => {
  const features = DISPLAY_DATA.map((feature, index) => (
    <Feature
      key={index}
      icon={feature.icon}
      title={feature.title}
      description={feature.description}
    />
  ));

  return (
    <Container size='md'>
      <Title
        order={2}
        fz={{ base: rem(22), sm: rem(35) }}
        ta='center'
        c='white'
      >
        What Makes Us Different
      </Title>

      <SimpleGrid
        mt={rem(50)}
        cols={{ base: 1, sm: 2, md: 2 }}
        spacing={{ base: 'xl', md: 'xl' }}
        verticalSpacing={{ base: 'xl', md: 50 }}
      >
        {features}
      </SimpleGrid>
    </Container>
  );
};

export default Features;
