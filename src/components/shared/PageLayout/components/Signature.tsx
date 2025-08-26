import Link from 'next/link';
import { Anchor, Flex, Text, Title } from '@mantine/core';
import { colors, fontSizes } from '@/utils/ui-utils';
import { getResponsiveTextAlign, getCurrentYear } from '@/utils/layout-utils';

const Signature = () => {
  const textAlign = getResponsiveTextAlign();

  return (
    <Flex direction='column' gap={5}>
      <Text fz={fontSizes.sm} c={colors.text.primary} fw='500' ta={textAlign}>
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
        <Title order={3} c={colors.text.brand} mt={-1} ta={textAlign}>
          kickstart.sh
        </Title>
      </Anchor>
      <Text c={colors.text.secondary} fz={fontSizes.xs} ta={textAlign}>
        &copy; {getCurrentYear()} All rights reserved.
      </Text>
    </Flex>
  );
};

export default Signature;
