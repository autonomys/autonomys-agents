import { BoxProps, FlexProps, TextProps } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';

// Define keyframes for animations
export const pulseKeyframes = keyframes`
  0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.7; }
  100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
`;

export const dataFlowKeyframes = keyframes`
  0% { background-position: 100% 0%; }
  100% { background-position: -100% 0%; }
`;

// Store animation references
export const pulseAnimation = `${pulseKeyframes} 2s infinite`;
export const dataFlowAnimation = `${dataFlowKeyframes} 3s ease infinite`;

// Main container styles
export const tabContainerStyles: BoxProps = {
  position: 'relative',
  overflow: 'hidden',
  mb: 4,
  borderRadius: 'md',
  bg: 'linear-gradient(180deg, rgba(20, 20, 35, 0.95) 0%, rgba(15, 15, 25, 0.9) 100%)',
  boxShadow: '0 4px 15px -5px rgba(0, 0, 0, 0.5)',
};

// Neural Network Background styles
export const neuralNetworkBgStyles: BoxProps = {
  position: 'absolute',
  top: '0',
  left: '0',
  right: '0',
  bottom: '0',
  opacity: '0.1',
  backgroundImage:
    'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};

// Tab Container Flex styles
export const tabFlexContainerStyles: FlexProps = {
  position: 'relative',
  zIndex: '2',
};

// Function to get tab item styles
export const getTabItemStyles = (index: number): FlexProps => ({
  direction: 'column',
  align: 'center',
  justify: 'center',
  flex: '1',
  py: 3,
  position: 'relative',
  cursor: 'pointer',
  transition: 'all 0.3s',
  _hover: {
    bg: `rgba(${index === 0 ? '0, 255, 153' : index === 1 ? '255, 0, 204' : '0, 204, 255'}, 0.1)`,
  },
});

// Function to get active tab indicator styles
export const getActiveTabIndicatorStyles = (tabColor: string, activeGlow: string): BoxProps => ({
  position: 'absolute',
  bottom: '0',
  left: '10%',
  right: '10%',
  height: '2px',
  bgGradient: `linear(to-r, transparent, ${tabColor}, transparent)`,
  boxShadow: activeGlow,
});

// Function to get neural node styles
export const getNeuralNodeStyles = (
  isActive: boolean,
  tabColor: string,
  activeGlow: string,
): BoxProps => ({
  width: isActive ? '12px' : '8px',
  height: isActive ? '12px' : '8px',
  borderRadius: '50%',
  bg: isActive ? tabColor : 'rgba(255, 255, 255, 0.3)',
  mb: 2,
  boxShadow: isActive ? activeGlow : 'none',
  transition: 'all 0.3s',
  position: 'relative',
});

// Function to get pulsing effect styles
export const getPulsingEffectStyles = (tabColor: string): BoxProps => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  border: `1px solid ${tabColor}`,
  opacity: '0',
  animation: pulseAnimation,
});

// Function to get tab label styles
export const getTabLabelStyles = (isActive: boolean, tabColor: string): TextProps => ({
  fontSize: 'sm',
  fontWeight: isActive ? 'bold' : 'medium',
  color: isActive ? 'white' : 'whiteAlpha.700',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  position: 'relative',
  textShadow: isActive ? `0 0 5px ${tabColor}80` : 'none',
  transition: 'all 0.3s',
});

// Function to get data flow animation styles
export const getDataFlowAnimationStyles = (tabColor: string): BoxProps => ({
  position: 'absolute',
  top: '0',
  left: '0',
  right: '0',
  height: '100%',
  background: `linear-gradient(90deg, 
    rgba(0,0,0,0) 0%, 
    ${tabColor}10 30%, 
    ${tabColor}10 70%, 
    rgba(0,0,0,0) 100%)`,
  backgroundSize: '200% 100%',
  animation: dataFlowAnimation,
  pointerEvents: 'none',
});
