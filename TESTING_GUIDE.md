# Click Tracking Fix - Testing Guide

## Overview
This document provides step-by-step testing instructions to verify that the click tracking category mismatch issue has been resolved.

## Prerequisites
1. Have at least 3-4 active categories configured in the admin panel with different commission percentages
2. Ensure each category has products (either curated or via search queries)
3. Login as an agent/admin user to track clicks
4. Have access to the AgentClicksScreen to view tracked clicks

## Test Scenarios

### Scenario 1: Click from Home Screen Category Row

**Steps:**
1. Open the app and navigate to the Home screen
2. Scroll to find a category row (e.g., "Electronics")
3. Note the category name displayed
4. Click on any product in that category row
5. On the Product Detail screen, click "View on Amazon"
6. Navigate to Profile → Agent Clicks
7. Find the most recent click entry

**Expected Result:**
- The click should be categorized under the category from which you clicked (e.g., "Electronics")
- The commission percentage should match the percentage configured for that category
- Console logs should show: `Category source: Navigation Context`

---

### Scenario 2: Click from Categories Screen

**Steps:**
1. Navigate to the Categories tab (bottom navigation)
2. Select a category from the left sidebar (e.g., "Beauty")
3. Click on any product from the grid
4. On the Product Detail screen, click "View on Amazon"
5. Navigate to Profile → Agent Clicks
6. Find the most recent click entry

**Expected Result:**
- The click should be categorized as "Beauty" (or whatever category you selected)
- Commission percentage matches the Beauty category settings
- Console logs show: `Category source: Navigation Context`

---

### Scenario 3: Click from Products Screen with Filter

**Steps:**
1. Navigate to the Products screen (search icon or "See All" from a category)
2. Select a category filter from the horizontal scroll (e.g., "Watches")
3. Wait for products to load
4. Click on any product
5. On the Product Detail screen, click "View on Amazon"
6. Navigate to Profile → Agent Clicks
7. Check the most recent click

**Expected Result:**
- Click categorized as "Watches"
- Correct commission rate applied
- Console: `Category source: Navigation Context`

---

### Scenario 4: Click from Search Results

**Steps:**
1. Go to Products screen
2. Search for a specific product (e.g., "laptop")
3. Click on any search result
4. Click "View on Amazon"
5. Check Agent Clicks

**Expected Result:**
- Category might be "All" or auto-detected based on product name
- If auto-detected, should match based on the SMART_MAP logic in backend
- Commission applied based on detected/default category

---

### Scenario 5: Multiple Categories - Same Product

**Purpose:** Verify that the same product clicked from different categories is tracked with different categories

**Steps:**
1. Find a product that appears in multiple categories (e.g., a smartwatch might be in both "Electronics" and "Watches")
2. Click it from "Electronics" category → "View on Amazon" → Note the category in Agent Clicks
3. Go back, navigate to "Watches" category
4. Click the same product → "View on Amazon"
5. Check Agent Clicks for both entries

**Expected Result:**
- First click: Category = "Electronics", Commission = Electronics %
- Second click: Category = "Watches", Commission = Watches %
- Two separate entries with different categories

---

### Scenario 6: Direct Navigation (Fallback Test)

**Purpose:** Test that the system gracefully handles missing category context

**Steps:**
1. If possible, open a product detail via a deep link or share link (without category context)
2. Alternatively, modify the code temporarily to pass `categoryContext: null`
3. Click "View on Amazon"
4. Check Agent Clicks

**Expected Result:**
- Category should be auto-detected from Amazon product metadata or product name
- Console: `Category source: Product Metadata`
- Still creates a click entry with best-effort category detection

---

## Verification Checklist

### Backend Database Checks

Use MongoDB Compass or similar to verify:

```javascript
// Find recent clicks
db.productclicks.find().sort({ createdAt: -1 }).limit(10)

// Check category distribution
db.productclicks.aggregate([
  { $group: { _id: "$category", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// Verify commission rates are varied (not all same default 2%)
db.productclicks.find({ createdAt: { $gte: new Date('2025-12-31') } }).sort({ createdAt: -1 })
```

**Expected:**
- Categories should match your configured category names (not random Amazon category names)
- `commissionRate` should vary based on category (e.g., 0.05 for 5%, 0.03 for 3%, etc.)
- `category` field should rarely be "Uncategorized" or "Unknown" when clicked from app

---

### Console Log Verification

When clicking "View on Amazon", check the Metro console for logs like:

```
[ProductDetail] Opening Amazon link: https://...
[ProductDetail] Tracking click with category: Electronics
[ProductDetail] Category source: Navigation Context
[ProductDetail] With token: YES
```

**What to verify:**
- Category name matches what you expect
- Source is "Navigation Context" (not "Product Metadata") for app navigation
- Token is present if logged in

---

### Agent Clicks Screen

1. Open Profile → Agent Clicks
2. Apply category filter
3. Verify:
   - Categories can be filtered correctly  
   - Click entries show proper category names
   - Date/status filters work
   - Commission amounts align with category percentages

---

## Common Issues & Solutions

### Issue 1: Category still shows "Unknown" or "Uncategorized"

**Possible Causes:**
- Category context not being passed correctly
- Category name/amazonSearchIndex mismatch with database

**Debug Steps:**
1. Check console logs - is `Category source: Navigation Context` shown?
2. If "Product Metadata", check if categoryContext is being passed in navigation
3. Verify category configuration in admin panel (name and amazonSearchIndex)

---

### Issue 2: Wrong commission percentage

**Possible Causes:**
- Category matched but commission rate not updated
- Category detection fallback to default

**Debug Steps:**
1. Check the category in the click entry
2. Verify that category's percentage in admin panel
3. Look at the backend console for category matching logs

---

### Issue 3: Same product always gets same category regardless of where clicked

**Possible Causes:**
- CategoryContext not being updated when switching categories/filters
- Stale state in ProductsScreen

**Debug Steps:**
1. Add more console logs to track `activeCategoryContext` state changes
2. Verify `setActiveCategoryContext` is being called in filter handlers
3. Check React DevTools for state updates

---

## Success Criteria

✅ **All tests pass if:**
1. Clicks from different category sources are tagged with the correct source category
2. Commission rates vary according to category configuration (not all 2%)
3. Console shows "Navigation Context" for app-based navigation
4. No "Uncategorized" entries when clicking from configured categories
5. Agent Clicks screen displays correct category information
6. Same product clicked from different categories creates separate entries with different categories

---

## Additional Testing (Edge Cases)

- [ ] Test with newly created categories
- [ ] Test after editing a category's amazonSearchIndex
- [ ] Test with categories that have very similar names
- [ ] Test with products that have category keywords in their names
- [ ] Test offline → online scenario (check if clicks queue properly)
- [ ] Test with guest users (no token) - should still track with category

---

## Rollback Plan

If issues are found:
1. Revert the 4 frontend files to previous versions:
   - `CategoryRow.js`
   - `ProductsScreen.js`
   - `CategoriesScreen.js`
   - `ProductDetailScreen.js`
2. Backend requires no changes (backward compatible)
3. Existing click data remains intact
