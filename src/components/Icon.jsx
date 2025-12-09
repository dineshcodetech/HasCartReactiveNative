import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {IconNames} from '../config/icons';

/**
 * Reusable Icon Component
 * Uses Google Material Design Icons
 * 
 * @param {string} name - Icon name from IconNames config
 * @param {number} size - Icon size (default: 24)
 * @param {string} color - Icon color (default: '#333')
 * @param {object} style - Additional styles
 */
const Icon = ({name, size = 24, color = '#333', style}) => {
  const iconName = IconNames[name] || name;
  
  try {
    return (
      <MaterialIcons
        name={iconName}
        size={size}
        color={color}
        style={style}
      />
    );
  } catch (error) {
    console.warn(`Icon "${iconName}" not found:`, error);
    // Fallback: return a simple view with a dot
    return (
      <MaterialIcons
        name="circle"
        size={size}
        color={color}
        style={style}
      />
    );
  }
};

export default Icon;

