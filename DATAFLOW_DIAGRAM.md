# Click Tracking Data Flow

## Before Fix (Incorrect Behavior)

```
User Journey:
├─ Home Screen
│  └─ Electronics Category Row
│     └─ Clicks on "Samsung Smart TV"
│        └─ ProductDetailScreen
│           └─ Extracts category from product.BrowseNodeInfo
│              └─ Gets "Home Theater Systems" (Amazon's category)
│                 └─ Backend receives category = "Home Theater Systems"
│                    └─ No match in database
│                       └─ Falls back to auto-detection
│                          └─ Matches "TV" keyword → "Electronics"
│                             └─ ❌ BUT sometimes matches incorrectly due to ambiguous keywords
```

**Problems:**
- Relied on Amazon's category structure (unpredictable)
- Auto-detection could mismatch (e.g., "TV stand" → Furniture vs Electronics)
- Lost context of user's browsing intent
- Inconsistent commission rates

---

## After Fix (Correct Behavior)

```
User Journey:
├─ Home Screen
│  └─ Electronics Category Row (has category object with amazonSearchIndex="Electronics")
│     └─ Clicks on "Samsung Smart TV"
│        └─ Navigation includes categoryContext:
│           {
│             name: "Electronics",
│             amazonSearchIndex: "Electronics",
│             _id: "cat_123"
│           }
│        └─ ProductDetailScreen
│           └─ PRIORITY 1: Use categoryContext.amazonSearchIndex
│              └─ category = "Electronics"
│                 └─ Backend receives category = "Electronics"
│                    └─ ✅ Direct match in database
│                       └─ Apply Electronics commission rate (e.g., 3%)
│                          └─ ✅ Accurate tracking & commission
```

**Benefits:**
- Preserves user's browsing context
- Direct database match (no ambiguity)
- Consistent categorization
- Accurate commission calculation

---

## Data Flow Comparison

### Before (Missing Category Context)
```javascript
// CategoryRow.js
handleProductClick(product) {
  navigation.navigate('ProductDetail', { product })
  // ❌ No category info passed
}

// ProductDetailScreen.js
const category = product.BrowseNodeInfo?.BrowseNodes?.[0]?.DisplayName
// ❌ Unreliable Amazon metadata
// Could be: "Home Theater Systems", "TVs", "Audio & Video", etc.

// Backend
category = "Home Theater Systems" 
→ No match in DB 
→ Auto-detect "TV" keyword 
→ Match "Electronics" (lucky!)
→ But might match "Furniture" if keyword was "TV Stand"
```

### After (With Category Context)
```javascript
// CategoryRow.js
handleProductClick(product) {
  navigation.navigate('ProductDetail', { 
    product,
    categoryContext: {
      name: "Electronics",
      amazonSearchIndex: "Electronics",
      _id: "cat_123"
    }
  })
  // ✅ Full category context preserved
}

// ProductDetailScreen.js
const category = categoryContext?.amazonSearchIndex || 
                categoryContext?.name || 
                product.BrowseNodeInfo?.BrowseNodes?.[0]?.DisplayName
// ✅ Priority: categoryContext first, then fallback to product metadata

// Backend
category = "Electronics" (from amazonSearchIndex)
→ Direct match in DB via amazonSearchIndex field
→ Apply configured Electronics % (e.g., 3%)
→ ✅ Accurate every time
```

---

## State Management Flow (ProductsScreen Example)

```javascript
ProductsScreen Component State:

[User selects "Electronics" filter]
  ↓
handleFilterPress(filter)
  ↓
setActiveCategoryContext({
  name: "Electronics",
  amazonSearchIndex: "Electronics", 
  _id: "filter_id"
})
  ↓
[User clicks a product]
  ↓
navigation.navigate('ProductDetail', {
  product: item,
  categoryContext: activeCategoryContext  // ← Context passed
})
  ↓
ProductDetailScreen receives categoryContext
  ↓
[User clicks "View on Amazon"]
  ↓
trackProductClick({
  category: categoryContext.amazonSearchIndex,  // ← Used for tracking
  ...productData
})
  ↓
Backend processes with accurate category
  ↓
✅ Click saved with correct category & commission
```

---

## Category Priority Logic in ProductDetailScreen

```javascript
// Priority Order for Category Detection:
const detectedCategory = 
  categoryContext?.amazonSearchIndex ||     // 1️⃣ HIGHEST: From navigation/filter
  categoryContext?.name ||                  // 2️⃣ Fallback: Category name
  product.BrowseNodeInfo?.BrowseNodes?.[0]?.DisplayName ||  // 3️⃣ Amazon Browse Node
  product.ItemInfo?.Classifications?.ProductGroup?.DisplayValue ||  // 4️⃣ Product Group
  'Unknown';                                // 5️⃣ LOWEST: Default

// This ensures:
// - App navigation always wins (most accurate)
// - Direct links still work (falls back to Amazon data)
// - Never completely fails (always has a category)
```

---

## Backend Matching Logic (Unchanged)

The backend has a robust matching system that works better with accurate input:

```javascript
Backend Category Matching Priority:

1. Exact Match
   ↓
   category = "Electronics" (from categoryContext.amazonSearchIndex)
   →  Match DB.categories.amazonSearchIndex === "Electronics"
   ✅ Found! Apply category.percentage

2. Normalize via Smart Map (if not exact match)
   ↓
   resolveSearchIndex("Electronics") → "Electronics"
   →  Check again with normalized value
   
3. Smart Keyword Detection (fallback for missing context)
   ↓
   productName = "Samsung 55 inch Smart LED TV"
   →  Regex match "\\btv\\b" → maps to "Electronics"
   →  Check if "Electronics" category exists
   ✅ Found! Apply percentage

4. Final Fallback
   ↓
   category = "Uncategorized"
   commissionRate = 0.02 (2% default)
```

With our fix, Steps 3-4 are rarely needed because we provide accurate input at Step 1.

---

## Example Scenario

**User Action:** Browse Electronics → Click Samsung TV → View on Amazon

### Before Fix
```
Click Data Saved:
{
  category: "Home Theater Systems",  // ❌ From Amazon metadata
  commissionRate: 0.02,              // ❌ Default (no match)
  ...
}
```

### After Fix
```
Click Data Saved:
{
  category: "Electronics",           // ✅ From categoryContext
  commissionRate: 0.03,              // ✅ Electronics category rate
  ...
}
```

**Result:** Correct attribution + Higher commission (3% vs 2%)
