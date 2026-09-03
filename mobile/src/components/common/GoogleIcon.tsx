import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme';

export type GoogleIconName = keyof typeof MaterialIcons.glyphMap;

interface GoogleIconProps {
  name: GoogleIconName;
  size?: number;
  color?: string;
  style?: object;
}

export const GoogleIcon: React.FC<GoogleIconProps> = ({
  name,
  size = 22,
  color = colors.text.primary,
  style,
}) => {
  return <MaterialIcons name={name} size={size} color={color} style={style} />;
};
