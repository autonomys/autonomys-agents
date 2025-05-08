import React from 'react';
import { Flex, Box, Text, useToken } from '@chakra-ui/react';
import {
  tabContainerStyles,
  neuralNetworkBgStyles,
  tabFlexContainerStyles,
  getTabItemStyles,
  getActiveTabIndicatorStyles,
  getNeuralNodeStyles,
  getPulsingEffectStyles,
  getTabLabelStyles,
  getDataFlowAnimationStyles,
} from './styles/TabNavigationStyles';

interface TabNavigationProps {
  activeTabIndex: number;
  onTabChange: (index: number) => void;
  tabs: { id: number; label: string }[];
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTabIndex, onTabChange, tabs }) => {
  const [neonPink, neonBlue, neonGreen] = useToken('colors', [
    'brand.neonPink',
    'brand.neonBlue',
    'brand.neonGreen',
  ]);

  return (
    <Box {...tabContainerStyles}>
      {/* Neural Network Background */}
      <Box {...neuralNetworkBgStyles} />

      {/* Tab Container */}
      <Flex {...tabFlexContainerStyles}>
        {tabs.map((tab, index) => {
          const isActive = activeTabIndex === tab.id;

          // Colorful glow effect for active tab
          const activeGlow =
            index === 0
              ? `0 0 15px ${neonGreen}60`
              : index === 1
                ? `0 0 15px ${neonPink}60`
                : `0 0 15px ${neonBlue}60`;

          // Tab color based on index
          const tabColor = index === 0 ? neonGreen : index === 1 ? neonPink : neonBlue;

          return (
            <Flex key={tab.id} {...getTabItemStyles(index)} onClick={() => onTabChange(tab.id)}>
              {/* Active Tab Indicator */}
              {isActive && <Box {...getActiveTabIndicatorStyles(tabColor, activeGlow)} />}

              {/* Neural Node */}
              <Box {...getNeuralNodeStyles(isActive, tabColor, activeGlow)}>
                {/* Add pulsing effect for active tab */}
                {isActive && <Box {...getPulsingEffectStyles(tabColor)} />}
              </Box>

              {/* Tab Label */}
              <Text {...getTabLabelStyles(isActive, tabColor)}>{tab.label}</Text>

              {/* Data flow animation for active tab */}
              {isActive && <Box {...getDataFlowAnimationStyles(tabColor)} />}
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
};

export default TabNavigation;
