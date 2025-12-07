# Tailwind CSS (NativeWind) Usage Guide

NativeWind has been successfully set up in your React Native project! You can now use Tailwind CSS classes in your components.

## How to Use

### Basic Usage

Instead of using `StyleSheet.create()`, you can use Tailwind classes directly with the `className` prop:

```jsx
import { View, Text } from 'react-native';

// Before (StyleSheet)
<View style={styles.container}>
  <Text style={styles.title}>Hello</Text>
</View>

// After (Tailwind)
<View className="flex-1 bg-gray-100 p-4">
  <Text className="text-2xl font-bold text-gray-800">Hello</Text>
</View>
```

### Example: Converting LoginScreen Components

Here's how you can convert your existing styles to Tailwind:

**Container:**
```jsx
// Before
<View style={styles.container}>
// styles.container = { flex: 1, backgroundColor: '#f8f9fa' }

// After
<View className="flex-1 bg-gray-50">
```

**Input Field:**
```jsx
// Before
<TextInput style={styles.input} />
// styles.input = { backgroundColor: '#fff', borderRadius: 12, padding: 16, ... }

// After
<TextInput className="bg-white rounded-xl p-4 text-base text-gray-800 border border-gray-200" />
```

**Button:**
```jsx
// Before
<TouchableOpacity style={styles.submitButton}>
// styles.submitButton = { backgroundColor: '#4CAF50', borderRadius: 12, padding: 18, ... }

// After
<TouchableOpacity className="bg-green-500 rounded-xl py-4.5 px-6 items-center shadow-lg">
  <Text className="text-white text-lg font-bold">Sign In</Text>
</TouchableOpacity>
```

### Common Tailwind Classes for React Native

- **Layout**: `flex`, `flex-1`, `flex-row`, `items-center`, `justify-center`
- **Spacing**: `p-4`, `px-6`, `py-2`, `m-4`, `mx-auto`, `mb-4`
- **Colors**: `bg-blue-500`, `text-gray-800`, `border-gray-200`
- **Typography**: `text-lg`, `text-2xl`, `font-bold`, `font-semibold`
- **Borders**: `rounded-lg`, `rounded-full`, `border`, `border-2`
- **Shadows**: `shadow-md`, `shadow-lg`, `elevation-5` (Android)

### Mixing Styles

You can still use StyleSheet alongside Tailwind:

```jsx
<View className="flex-1 bg-white" style={{ paddingTop: Platform.OS === 'ios' ? 50 : 0 }}>
  <Text className="text-xl font-bold">Content</Text>
</View>
```

### Important Notes

1. Use `className` prop instead of `style` for Tailwind classes
2. Some web-specific Tailwind features may not work in React Native
3. You can still use `style` prop for dynamic styles or platform-specific adjustments
4. After making changes, you may need to restart Metro bundler: `npm start -- --reset-cache`

## Next Steps

1. Start converting your components to use Tailwind classes
2. Customize colors in `tailwind.config.js` to match your brand
3. Use Tailwind's responsive utilities (though limited in React Native)
4. Explore NativeWind documentation: https://www.nativewind.dev/

Happy styling! 🎨


