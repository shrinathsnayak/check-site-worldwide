import Link from 'next/link';
import { Anchor, Flex, Text, Title } from '@mantine/core';

const Signature = () => {
  return (
    <Flex direction='column' gap={5}>
      <Text fz='sm' c='white' fw='500' ta={{ base: 'center', sm: 'left' }}>
        Project By
      </Text>
      <Anchor
        prefetch
        target='_blank'
        component={Link}
        href='https://kickstart.sh'
        underline='never'
        w={{ base: '100%', sm: 'max-content' }}
      >
        <Title order={3} c='red.8' mt={-1} ta={{ base: 'center', sm: 'left' }}>
          kickstart.sh
        </Title>
      </Anchor>
      <Text c='dimmed' fz='xs' ta={{ base: 'center', sm: 'left' }}>
        &copy; {new Date().getFullYear()} All rights reserved.
      </Text>
    </Flex>
  );
};

export default Signature;
