# Follow-ups Section - Testing Guide 🧪

## Quick Test Checklist

### 🎯 Core Features to Test

#### 1. Phone Call Button 📞
```
Location: First button in action bar (blue phone icon)
Action: Click the "Call" button
Expected: Opens phone dialer with seeker's number
```

**Test Steps:**
1. Go to Tasks → Follow-ups tab
2. Find any follow-up task
3. Click the **Call** button (blue phone icon)
4. ✅ Phone dialer should open with correct number
5. ✅ On mobile: Native dialer should open
6. ✅ On desktop: Should prompt to open phone app

---

#### 2. Delete Button 🗑️
```
Location: Last button in action bar (red trash icon)
Action: Click the trash icon
Expected: Shows confirmation dialog → Deletes task
```

**Test Steps:**
1. Find a follow-up task that is NOT completed
2. Click the **Trash** icon (red delete button)
3. ✅ Confirmation dialog appears
4. ✅ Seeker name is shown in the dialog
5. ✅ Warning "This action cannot be undone" appears
6. Click **Cancel**:
   - ✅ Dialog closes
   - ✅ Task remains on board
7. Click trash icon again
8. Click **Delete**:
   - ✅ Task is deleted
   - ✅ Success toast appears
   - ✅ Task removed from board

---

#### 3. Delete Button Visibility 👁️
```
Test: Read-only tasks should NOT have delete button
```

**Test Steps:**
1. Find a follow-up task where seeker stage is:
   - REGISTERED, or
   - NOT_INTERESTED, or
   - COMPLETED
2. ✅ Delete button (trash icon) should be HIDDEN
3. Only 3 buttons should show: [Call] [History] [View]

---

#### 4. Drag & Drop Interaction 🎯
```
Test: Buttons should hide while dragging
```

**Test Steps:**
1. Click and hold a task card
2. Start dragging
3. ✅ Action buttons should disappear
4. ✅ "Moving..." text should appear
5. Drop in another column
6. ✅ Status update dialog appears
7. ✅ Buttons reappear after drop

---

#### 5. History & View Buttons 📜
```
Test: Existing features still work
```

**Test Steps:**
1. Click **History** button
   - ✅ Action history dialog opens
   - ✅ All status changes are shown
2. Click **View** button
   - ✅ Task details dialog opens
   - ✅ All task information is displayed

---

## Button Layout Reference

### Active Task (Not Read-only)
```
┌─────────────────────────────────────┐
│ [📞 Call] [📜 History] [👁 View] [🗑️] │
└─────────────────────────────────────┘
```

### Read-only Task (Completed/Registered)
```
┌───────────────────────────────┐
│ [📞 Call] [📜 History] [👁 View] │
└───────────────────────────────┘
```

### Dragging State
```
┌─────────────┐
│  Moving...  │
└─────────────┘
```

---

## Error Testing 🚨

### Test Error Handling

#### Delete Error
1. Disconnect internet
2. Try to delete a task
3. ✅ Error toast should appear
4. ✅ Task should remain on board

#### API Error
1. Open browser console (F12)
2. Go to Network tab
3. Set network to "Offline"
4. Try any action
5. ✅ Appropriate error message should show

---

## Mobile Testing 📱

### On Mobile Device:
1. **Phone Call**
   - ✅ Should open native phone dialer
   - ✅ Number should be pre-filled
   - ✅ One tap to call

2. **Touch Interactions**
   - ✅ All buttons should be easily tappable
   - ✅ No accidental drags when clicking buttons
   - ✅ Drag should work smoothly

3. **Dialog Responsiveness**
   - ✅ Delete dialog should fit screen
   - ✅ Text should be readable
   - ✅ Buttons should be easy to tap

---

## Data Verification 🔍

### Check Data Consistency:
1. Delete a task
2. Refresh the page
3. ✅ Deleted task should NOT reappear
4. ✅ All other tasks should remain

---

## Performance Testing ⚡

### Test with Many Tasks:
1. If you have 50+ follow-up tasks:
   - ✅ Drag and drop should be smooth
   - ✅ Delete should be instant (optimistic update)
   - ✅ No lag when clicking buttons
   - ✅ Scrolling should be smooth

---

## Common Issues & Solutions 🔧

### Issue: Delete button visible on completed tasks
**Solution**: Check if the task's seeker stage is correctly set
- Should be REGISTERED, NOT_INTERESTED, or COMPLETED

### Issue: Phone call doesn't work
**Solution**: 
- Check if browser allows tel: links
- On desktop: May need to configure default phone app
- On mobile: Should work by default

### Issue: Delete doesn't work
**Solution**:
- Check browser console for errors
- Verify API endpoint `/api/tasks/[id]` is working
- Check user permissions (backend)

### Issue: Buttons don't disappear when dragging
**Solution**:
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

---

## Success Criteria ✅

Your Follow-ups section is working correctly if:

- ✅ Phone call button opens dialer
- ✅ Delete button works with confirmation
- ✅ Delete button hidden for read-only tasks
- ✅ Drag & drop hides buttons while dragging
- ✅ All actions show appropriate toast notifications
- ✅ No console errors
- ✅ All changes persist after page refresh
- ✅ Mobile experience is smooth
- ✅ History and View buttons still work

---

## Browser Testing 🌐

Test on:
- ✅ Chrome/Edge (Desktop)
- ✅ Safari (Desktop)
- ✅ Firefox (Desktop)
- ✅ Chrome (Mobile)
- ✅ Safari (Mobile)

---

## Final Verification 🎊

After all tests pass:

1. **Local Testing**
   ```bash
   npm run dev
   ```
   - Test all features
   - No console errors
   - All interactions smooth

2. **Build Test**
   ```bash
   npm run build
   ```
   - Build should succeed
   - No warnings

3. **Deploy**
   ```bash
   git add .
   git commit -m "Fix all issues in follow-ups section"
   git push
   ```

4. **Production Test**
   - Wait 2-3 minutes
   - Visit Vercel deployment
   - Re-test all features

---

**Ready to Test?** Start with the Phone Call button - it's the easiest! 📞

**Found an issue?** Check the console (F12) for error messages and let me know! 🔍
