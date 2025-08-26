import { Container, SimpleGrid, Title, rem } from '@mantine/core';
import Feature from './Features/Feature';
import { FEATURES_DATA, mapFeatureDataToProps } from '@/utils/features-utils';

const Features = () => {
  const featureProps = mapFeatureDataToProps(FEATURES_DATA);

  const features = featureProps.map((feature, index) => (
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
