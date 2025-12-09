import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Icon names mapping - Google Material Design Icons
export const IconNames = {
  // Navigation
  Home: 'home',
  Products: 'shopping-bag',
  Profile: 'person',
  
  // Categories
  Electronics: 'devices',
  Fashion: 'checkroom',
  HomeCategory: 'home',
  Sports: 'sports-soccer',
  
  // Product
  ProductPlaceholder: 'inventory-2',
  ShoppingCart: 'shopping-cart',
  
  // Profile & Account
  Edit: 'edit',
  Orders: 'shopping-bag',
  Addresses: 'location-on',
  Payment: 'payment',
  Notifications: 'notifications',
  Language: 'language',
  Theme: 'palette',
  Help: 'help-outline',
  Contact: 'phone',
  Rate: 'star',
  
  // Common
  Search: 'search',
  Add: 'add',
  ArrowRight: 'chevron-right',
  ArrowLeft: 'arrow-back',
  Logout: 'logout',
};

// Icon component factory
export const createIcon = (name, size = 24, color = '#333') => {
  return <MaterialIcons name={name} size={size} color={color} />;
};

export default IconNames;

