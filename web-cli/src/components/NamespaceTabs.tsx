import React from 'react';
import { Flex, Button, Text, Badge, Box } from '@chakra-ui/react';

interface NamespaceTabsProps {
  namespaces: string[];
  activeNamespace: string;
  namespaceCount: Record<string, number>;
  onNamespaceChange: (namespace: string) => void;
  onRefreshNamespaces: () => void;
  onClearLogs: () => void;
}

const NamespaceTabs: React.FC<NamespaceTabsProps> = ({
  namespaces,
  activeNamespace,
  namespaceCount,
  onNamespaceChange,
  onRefreshNamespaces,
  onClearLogs,
}) => {
  return (
    <Flex
      bg="rgba(20, 20, 30, 0.9)"
      borderBottom="1px solid"
      borderColor="gray.700"
      position="sticky"
      top="0"
      zIndex="10"
      justifyContent="flex-start"
      overflowX="auto"
      backdropFilter="blur(8px)"
      py={1}
      css={{
        "&::-webkit-scrollbar": {
          height: "4px",
        },
        "&::-webkit-scrollbar-track": {
          background: "rgba(0, 0, 0, 0.1)",
        },
        "&::-webkit-scrollbar-thumb": {
          background: "rgba(255, 0, 204, 0.3)",
          borderRadius: "4px",
        }
      }}
    >
      {namespaces.map(namespace => (
        <Button
          key={namespace}
          variant="ghost"
          py={[2, 3]}
          px={[4, 6]}
          color={activeNamespace === namespace ? "brand.neonPink" : "whiteAlpha.700"}
          bg={activeNamespace === namespace ? "rgba(26, 26, 46, 0.8)" : "transparent"}
          borderBottom={activeNamespace === namespace ? "2px solid" : "none"}
          borderColor="brand.neonPink"
          borderRadius="0"
          fontWeight="500"
          fontSize={["xs", "sm"]}
          textTransform="uppercase"
          letterSpacing="0.5px"
          _hover={{
            color: "white",
            bg: "rgba(255, 0, 204, 0.1)",
            boxShadow: "0 0 10px rgba(255, 0, 204, 0.2)",
          }}
          _active={{
            bg: "rgba(255, 0, 204, 0.15)",
          }}
          onClick={() => onNamespaceChange(namespace)}
          position="relative"
          transition="all 0.2s ease"
        >
          {namespace}
          {namespaceCount[namespace] > 0 && (
            <Badge
              ml="2"
              bg="rgba(255, 0, 204, 0.2)"
              color="brand.neonPink"
              borderRadius="full"
              px="2"
              py="0.5"
              fontSize={["xs", "sm"]}
              minW="16px"
              h="16px"
              fontWeight="600"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="0 0 8px rgba(255, 0, 204, 0.3)"
            >
              {namespaceCount[namespace]}
            </Badge>
          )}
        </Button>
      ))}
      <Button
        variant="ghost"
        ml="auto"
        bg="rgba(0, 204, 255, 0.1)"
        color="brand.neonBlue"
        p="2"
        fontSize={["xs", "sm"]}
        fontWeight="medium"
        transition="all 0.3s ease"
        _hover={{
          bg: "rgba(0, 204, 255, 0.2)",
          transform: "rotate(180deg)",
          boxShadow: "0 0 10px rgba(0, 204, 255, 0.3)",
        }}
        onClick={onRefreshNamespaces}
      >
        ↻
      </Button>
      <Button
        variant="ghost"
        ml="1"
        bg="rgba(239, 83, 80, 0.1)"
        color="#ef5350"
        fontSize={["xs", "sm"]}
        fontWeight="medium"
        p="2"
        px="4"
        _hover={{
          bg: "rgba(239, 83, 80, 0.2)",
          color: "#ff6b6b",
          boxShadow: "0 0 10px rgba(239, 83, 80, 0.3)",
        }}
        _active={{
          bg: "rgba(239, 83, 80, 0.3)",
        }}
        transition="all 0.2s ease"
        onClick={onClearLogs}
      >
        🗑️ Clear
      </Button>
    </Flex>
  );
};

export default NamespaceTabs;
