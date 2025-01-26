import { 
  Card, 
  CardBody, 
  Text, 
  VStack, 
  Button, 
  HStack, 
  Tooltip,
  Box,
  Badge,
  IconButton,
  Image,
} from '@chakra-ui/react';
import { ExternalLinkIcon, CopyIcon, ViewIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import ReactJson from 'react-json-view';
import { cardStyles, textStyles } from '../styles';
import { getTypeColor, getTypeColorScheme } from '../utils/typeUtils'
import { utcToLocalRelativeTime } from '../utils/timeUtils';
import { labelStyles } from '../styles/components/label';

interface ExperienceCardProps {
  item: any;
}

const AgentBadge = ({ agentName }: { agentName: string }) => (
    <Image
        src={`/agents/${agentName}.jpg`} 
        alt=""
        height="60px"
        width="60px"
        filter="drop-shadow(0 0 8px rgba(147, 112, 219, 0.5))"
        transition="all 0.3s ease"
        _hover={{
            filter: 'drop-shadow(0 0 12px rgba(147, 112, 219, 0.7))',
            transform: 'scale(1.05)',
        }}
        borderRadius="full"
        mr={2}
    />
);

export const ExperienceCard = ({ item }: ExperienceCardProps) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  
  return (
    <Card 
      {...cardStyles.baseStyle}
      borderLeft="4px solid"
      borderLeftColor={getTypeColor(item.content.type)}
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
    >
      <CardBody {...cardStyles.bodyStyle}>
        {/* Header with Metadata */}
        <HStack justify="space-between" mb={4}>
          <VStack align="start" spacing={1}>
            <HStack>
              <AgentBadge agentName={item.agent_name} />
              <Text {...textStyles.heading}>
                Learned Experience #{item.id}
              </Text>
            </HStack>
            <HStack margin={1.5}>
              <Text fontSize="xs" color="gray.500">
                CID: {item.cid.substring(0, 20)}...
              </Text>
            </HStack>
          </VStack>
          <VStack spacing={0} align="end">
            <Tooltip 
              label={new Date(item.timestamp).toLocaleString()} 
              placement="top"
            >
              <Text 
                color="gray.500" 
                fontSize="sm"
                cursor="help"
              >
                {utcToLocalRelativeTime(item.timestamp)}
              </Text>
            </Tooltip>
            <HStack spacing={2}>
              <Text fontSize="xs" color="gray.600">
                v{item.content.agentVersion || 'unknown'}
              </Text>
            </HStack>
          </VStack>
        </HStack>

        {/* JSON Viewer */}
        <Box 
          mb={4} 
          borderRadius="lg"
          overflow="hidden"
          bg="blackAlpha.400"
          p={4}
          position="relative"
        >
          <ReactJson 
            src={item.content}
            theme="tomorrow"
            collapsed={1}
            displayDataTypes={false}
            name={false}
            style={{
              backgroundColor: 'transparent',
              borderRadius: '0.5rem',
              fontSize: '1.2em',
            }}
            enableClipboard={false}
            displayObjectSize={false}
          />
          <IconButton
            aria-label="Copy"
            icon={<CopyIcon />}
            size="sm"
            position="absolute"
            top={2}
            right={2}
            onClick={() => copyToClipboard(JSON.stringify(item.content, null, 2))}
          />
        </Box>

        {/* Labels */}
        <HStack spacing={2} mb={4} wrap="wrap">
          <Badge 
            colorScheme={getTypeColorScheme(item.content.type)}
            {...labelStyles.baseStyle}
          >
            {item.content.type}
          </Badge>
        </HStack>

        {/* Actions */}
        <HStack spacing={4} justify="flex-end">
          <Button
            leftIcon={<ExternalLinkIcon />}
            as={RouterLink}
            to={`/memory/${item.cid}`}
            variant="outline"
            size="sm"
            color="green.400"
            borderColor="green.400"
            _hover={{
              bg: 'green.400',
              color: 'black',
              borderColor: 'green.400'
            }}
          >
            View Details
          </Button>
          <Button
            leftIcon={<ViewIcon />}
            as="a"
            href={`https://astral.autonomys.xyz/taurus/permanent-storage/files/${item.cid}`}
            target="_blank"
            variant="outline"
            size="sm"
            color="green.400"
            borderColor="green.400"
            _hover={{
              bg: 'green.400',
              color: 'black',
              borderColor: 'green.400'
            }}
          >
            Explorer
          </Button>
        </HStack>
      </CardBody>
    </Card>
  );
}; 