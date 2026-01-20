# Request Inquiry System - Quick Reference Guide

## 🎯 What Changed?

### Before
- ❌ Auto-refresh every 30 seconds (annoying!)
- ❌ No search or filtering
- ❌ Created ONE inquiry for ALL programs
- ❌ Duplicate phone numbers not allowed

### After
- ✅ Manual refresh button (you control it!)
- ✅ Search by name/phone + filter by program/date
- ✅ Creates ONE inquiry PER program requested
- ✅ Same phone number can register for multiple programs

---

## 🔍 Using the Search & Filters

### Search Bar
```
Type: "John Smith" or "0771234567"
Result: Shows matching visitors instantly
```

### Program Filter
```
Select: "BSc Business Administration"
Result: Shows only visitors who requested that program
```

### Date Range
```
Select: Jan 1 - Jan 15
Result: Shows only visitors registered in that period
```

### Clear All
```
Click: "Clear" button
Result: Resets all filters
```

---

## 🔄 Manual Refresh

**Top right corner → "Refresh" button**

- Click when you want latest data
- Shows spinning icon while loading
- Success message appears when done

---

## 📝 Converting to Inquiries

### Old Way (Before)
1. Click "Create Inquiry"
2. Dialog opens
3. Fill form manually
4. Creates 1 inquiry with multiple programs

### New Way (Now)
1. Click "Create Inquiries"
2. **Automatic!** System creates one inquiry per program
3. Done! Each coordinator gets their own inquiry

### Example
**Visitor:** John Smith (0771234567)
**Programs:** 3 programs requested

**Result:** 3 separate inquiries created
- Inquiry #1: BSc Business Admin (phone: 0771234567)
- Inquiry #2: BSc Supply Chain (phone: 0771234567)
- Inquiry #3: BSc Transportation (phone: 0771234567)

Each program coordinator can now handle their own inquiry independently!

---

## 🎯 Why These Changes?

### 1. Manual Refresh
**Problem:** Auto-refresh interrupted your work every 30 seconds
**Solution:** You click refresh when YOU want new data

### 2. Search & Filters
**Problem:** Hard to find specific inquiries in long list
**Solution:** Instant search and filtering by program/date

### 3. One Inquiry Per Program
**Problem:** Multiple coordinators confused about same inquiry
**Solution:** Each coordinator gets their own inquiry to handle

### 4. Duplicate Phone Numbers
**Problem:** System rejected same person registering for multiple programs
**Solution:** Same phone can be used for different programs

---

## 💡 Tips & Tricks

### For Coordinators

**Finding Your Inquiries:**
1. Use program filter
2. Select your program
3. Only see inquiries for your program

**Following Up:**
- Each inquiry has automatic follow-up tasks
- Tasks are program-specific
- No confusion with other coordinators

**Handling Duplicates:**
- Same person, different program = OK!
- System creates separate inquiry for each
- You handle your program, others handle theirs

### For Admins

**Monitoring Registrations:**
1. Use date range filter
2. See registrations per day/week/month
3. Export to Excel (future feature)

**Bulk Processing:**
1. Filter to see pending conversions
2. Convert one by one (bulk convert coming soon)
3. Check converted status after

---

## 🚨 Troubleshooting

### "No matching programs found"
**Cause:** Program names in request DB don't match main DB
**Solution:** Check program names match exactly (case-insensitive)

### "Failed to create inquiries"
**Cause:** Database connection issue or validation error
**Solution:** Check error message, try again, or contact support

### Filters not working
**Cause:** Browser cache issue
**Solution:** Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Button keeps spinning
**Cause:** Network issue or slow response
**Solution:** Wait 30 seconds, refresh page if still spinning

---

## 📊 Status Indicators

### Visitor Status
- **Pending (Blue):** Not yet converted to inquiry
- **Converted (Red):** Already processed

### Button States
- **Create Inquiries:** Ready to convert
- **Converting...:** Processing (wait)
- **Converted:** Already done (disabled)

### Program Counter
- Shows number like "3 programs"
- Indicates multiple inquiries will be created
- Helps you know what to expect

---

## ⚡ Keyboard Shortcuts

Coming soon! Future enhancement.

---

## 📞 Need Help?

**Technical Issues:** Contact development team
**Usage Questions:** Refer to full documentation: `REQUEST_INQUIRY_IMPROVEMENTS.md`
**Feature Requests:** Submit via project issue tracker

---

## 🎓 Best Practices

1. **Refresh regularly** when expecting new registrations
2. **Use filters** to focus on your programs
3. **Convert promptly** to ensure timely follow-ups
4. **Check descriptions** to see program-specific details
5. **Follow up** using the automatic tasks created

---

**Quick Start:**
1. Open "Exhibition Registration Requests"
2. Click "Refresh" to get latest data
3. Use filters to find your programs
4. Click "Create Inquiries" to convert
5. Follow up using tasks created

**That's it!** You're ready to use the improved system. 🚀

---

**Last Updated:** January 19, 2026
