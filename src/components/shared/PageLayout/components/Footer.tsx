import { AppShell, Container, Flex } from '@mantine/core';
import Signature from './Signature';

const Footer = () => {
  return (
    <AppShell.Footer
      fz='sm'
      bg='dark.9'
      pos='static'
      withBorder={false}
      style={{
        borderTop: '1px dashed var(--mantine-color-dark-5) !important',
      }}
    >
      <Container
        size='lg'
        style={{
          paddingInline: '0 !important',
          borderLeft: '1px dashed var(--mantine-color-dark-5) !important',
          borderRight: '1px dashed var(--mantine-color-dark-5) !important',
        }}
      >
        <Flex
          justify='space-between'
          p={{ base: 'sm', sm: 'lg' }}
          gap={{ base: 'lg', sm: 'xl' }}
          align={{ base: 'center', sm: 'flex-start' }}
          direction={{ base: 'column-reverse', sm: 'row' }}
        >
          <Signature />
        </Flex>
      </Container>
    </AppShell.Footer>
  );
};

export default Footer;
