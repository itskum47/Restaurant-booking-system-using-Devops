# TIER 1 Feature Testing Guide

Complete end-to-end testing guide for T1-1 (Auth), T1-2 (Email), and T1-3 (Stripe Payments).

## Prerequisites

All services must be running:
- Frontend: `npm run dev` in `services/frontend/` (port 5173)
- API Gateway: `npm start` in `services/api-gateway/` (port 3000)
- Booking Service: `python -m uvicorn app.main:app --reload` in `services/booking-service/` (port 8000)
- Notification Service: `npm start` in `services/notification-service/` (port 3003)
- MongoDB: Running on localhost:27017
- Redis: Running on localhost:6379

---

## TEST 1: User Registration (T1-1)

### Scenario: New user creates account

**Steps:**
1. Open http://localhost:5173
2. Click "Get Started" button (top right)
3. Stay on "Sign Up" tab
4. Fill form:
   - **Name**: John Doe
   - **Email**: john@example.com
   - **Password**: TestPass123 (observe strength indicator: green "Good/Strong")
   - **Confirm Password**: TestPass123
5. Click "Create Account" button

**Expected Results:**
- ✅ Password strength indicator shows "Strong" (green)
- ✅ Form validates (no errors)
- ✅ Button shows "⏳ Please wait..." during submission
- ✅ Redirects to `/chat` page
- ✅ Top-right navbar shows "👤 John" (user profile)
- ✅ Click profile → shows dropdown with name, email, "My Bookings", "Settings", "Log Out"

**Backend Verification:**
- Check MongoDB: `db.users_db.findOne({email: "john@example.com"})`
- Should have: `dine_credits: 100`, `membership_tier: "standard"`, hashed password

**Password Strength Test:**
- Try: "abc" → Red (Weak)
- Try: "abcd1234" → Yellow (Fair)
- Try: "Abcd1234!" → Green (Strong)

---

## TEST 2: User Login (T1-1)

### Scenario: Registered user logs back in

**Steps:**
1. On Auth page, click "Sign In" tab
2. Fill form:
   - **Email**: john@example.com
   - **Password**: TestPass123
3. **Optional**: Check "Remember Me" checkbox
4. Click "Sign In" button

**Expected Results:**
- ✅ Button shows "⏳ Please wait..." during submission
- ✅ Redirects to `/chat`
- ✅ JWT token stored in localStorage (check in browser DevTools → Application → localStorage → "dine_token")
- ✅ Navbar shows "👤 John"

**Error Case:**
- Try wrong password → "Invalid email or password" error displays in red banner

**Session Persistence:**
- Reload page (Cmd+R) → Should still be logged in
- Token persists from localStorage

---

## TEST 3: Protected Routes (T1-1)

### Scenario: User access to protected pages

**Steps (Logged In):**
1. Navigate to http://localhost:5173/chat
2. Should display chat page (no redirect)
3. Navigate to http://localhost:5173/bookings
4. Should display bookings page

**Steps (Logged Out):**
1. Log out (profile menu → "Log Out")
2. Navigate to http://localhost:5173/chat
3. Should redirect to `/auth` immediately
4. Browser shows "⏳ Loading..." during auth check

---

## TEST 4: Restaurant Booking (T1-1 + T1-2 + T1-3)

### Scenario: Complete booking flow with payment

**Precondition:** User must be logged in (use TEST 1 or TEST 2)

**Steps:**
1. Navigate to home (http://localhost:5173 or click "DINE.AI" logo)
2. Scroll down to restaurant list or search for a restaurant
3. Click any restaurant card (e.g., "Carbone", "Nobu")
4. On RestaurantDetailNew page, select:
   - **Date**: Any future date (click date input)
   - **Party Size**: 2-4 people (use +/- buttons)
   - **Time**: Click any available green slot (e.g., "7:00 PM")
5. Click "Reserve for [Time]" button

**Expected Results at Step 5:**
- ✅ PaymentModal opens (dark background modal)
- ✅ Shows booking summary:
  - Restaurant name (e.g., "Carbone")
  - Date, Time, Guests, Booking Fee ($2.00)
- ✅ CardElement visible for credit card input
- ✅ Two buttons: "Cancel" and "Pay $2.00 & Book"
- ✅ Green security badge: "🔒 Payments are securely processed by Stripe"

---

## TEST 5: Stripe Payment (T1-3)

### Scenario: Complete payment with test card

**Precondition:** PaymentModal open (from TEST 4, step 5)

**Steps:**
1. In CardElement, enter:
   - **Card Number**: 4242 4242 4242 4242
   - **Expiry**: 12/26 (or any future date)
   - **CVC**: 123 (any 3 digits)
   - **ZIP**: 12345 (any 5 digits)
   - **Name**: Should be pre-filled with user name
   - **Email**: Should be pre-filled with user email

2. Click "Pay $2.00 & Book" button

**Expected Results (Success Case):**
- ✅ Button shows "⏳ Processing..." (disabled)
- ✅ After 2-3 seconds, modal closes
- ✅ Redirects to `/confirmation` page
- ✅ Shows "Your booking is confirmed! ✓"
- ✅ Displays booking reference number (e.g., "RB-ABC12345")
- ✅ Shows booking details: restaurant, date, time, guests

**Expected Email (T1-2):**
- ✅ User receives booking confirmation email
- ✅ Email has DINE.AI branding (Cormorant serif, gold accent)
- ✅ Shows booking details and link to view reservations

**Error Case - Declined Card:**
1. Use card: 4000 0000 0000 0002
2. Fill other fields as above
3. Click "Pay $2.00 & Book"
4. Expected: "Your card was declined" error displays in modal
5. User can modify card and retry

**Error Case - Network Error:**
1. Stop API Gateway service
2. Fill card details
3. Click "Pay $2.00 & Book"
4. Expected: "Failed to initialize payment" error
5. User can retry (after restarting service)

---

## TEST 6: My Bookings (T1-1 + T1-3)

### Scenario: View confirmed bookings

**Precondition:** At least one booking completed (TEST 4+5)

**Steps:**
1. Click profile dropdown (top right "👤 John")
2. Click "My Bookings"
3. Should see list of bookings

**Expected Results:**
- ✅ Bookings page loads (`/bookings` route)
- ✅ Shows list with booking details:
  - Restaurant name
  - Date, time
  - Party size
  - Booking reference number
  - Booking status (Confirmed)
- ✅ Option to cancel or view details

---

## TEST 7: Logout and Session End (T1-1)

### Scenario: User logs out

**Steps:**
1. Click profile dropdown
2. Click "Log Out"

**Expected Results:**
- ✅ Redirects to home (`/`)
- ✅ Token removed from localStorage
- ✅ Navbar shows "Sign In" link instead of profile
- ✅ Protected routes redirect to `/auth`

---

## TEST 8: Email Verification

### Scenario: Verify booking confirmation email

**For Development:**
- Check notification service logs for email output
- If no SMTP configured, email logs to console
- Look for email template with:
  - DINE.AI header with logo
  - Booking ID
  - Restaurant name (gold, larger serif font)
  - Date, time, guests, location in grid
  - "View My Reservations" button
  - Cancellation policy footer

**For Production:**
- Check email inbox for email from: `DINE.AI Concierge <noreply@dine.ai>`
- Email should have dark theme (#0A0A0B background)
- Gold accents (#C9A84C)

---

## Browser DevTools Verification

### Test JWT Token Storage
1. Open DevTools (F12)
2. Go to "Application" tab
3. → "Local Storage"
4. → "http://localhost:5173"
5. **Expected**: Key "dine_token" with JWT value starting with "eyJ..."

### Test Stripe Integration
1. Open DevTools → "Network" tab
2. Make booking payment
3. **Expected**: See requests to:
   - `POST /api/v1/payments/create-intent` (returns client_secret)
   - `POST /api/v1/payments/confirm` (after Stripe confirms card)

### Test API Calls
1. Open DevTools → "Network" tab
2. Register/Login
3. **Expected**: Requests to:
   - `POST /api/auth/register`
   - `POST /api/auth/login`
   - `GET /api/auth/me` (on page load for session check)

---

## Full Test Checklist

| Test | Status | Notes |
|------|--------|-------|
| Register new user | ⬜ | Must see password strength indicator |
| Login existing user | ⬜ | Token should persist in localStorage |
| Protected routes | ⬜ | Redirect to /auth if not logged in |
| Select restaurant booking | ⬜ | PaymentModal opens correctly |
| Enter test card | ⬜ | CardElement accepts 4242 test card |
| Complete payment | ⬜ | Redirects to /confirmation |
| View booking in My Bookings | ⬜ | Shows booking details |
| Receive confirmation email | ⬜ | Email has correct template |
| Logout | ⬜ | Token removed, nav shows Sign In |
| Failed payment (declined) | ⬜ | Error message displays, user can retry |
| Protected route while logged out | ⬜ | Redirects to /auth |

---

## Troubleshooting

### Issue: "Failed to create payment intent"
- **Cause**: Booking service not running or not configured
- **Fix**: Start booking service, check STRIPE_SECRET_KEY in .env
- **Check**: `curl http://localhost:8000/docs` should show API docs

### Issue: "Stripe is not defined" in console
- **Cause**: VITE_STRIPE_PUBLIC_KEY not in .env or wrong value
- **Fix**: Update `services/frontend/.env` with correct public key
- **Check**: `npm run build` should not have errors

### Issue: PaymentModal doesn't appear
- **Cause**: RestaurantDetailNew not importing PaymentModal
- **Fix**: Check import at top of RestaurantDetailNew.jsx
- **Check**: `npm run build` should pass

### Issue: Email not received
- **Cause**: SMTP not configured or notification service down
- **Fix**: Check notification-service is running
- **Check**: Look for logs in terminal for email sending confirmation

### Issue: "Cannot GET /restaurant/name"
- **Cause**: Route not configured in frontend router
- **Fix**: Ensure RestaurantDetailNew.jsx mapped to `/restaurant/:name`
- **Check**: App.jsx should have `<Route path="/restaurant/:name" element={<ProtectedRoute><RestaurantDetailNew/></ProtectedRoute>} />`

---

## Performance Notes

### Expected Load Times
- Auth page load: < 500ms
- Restaurant detail: < 1s
- PaymentModal open: < 200ms (modal animation)
- Payment processing: 2-5 seconds (Stripe API call)
- Confirmation page: < 500ms

### Expected File Sizes (gzip)
- Frontend JS: ~133 KB
- Frontend CSS: ~7 KB
- Total: ~140 KB

---

## Success Criteria for Full TIER 1

✅ User can register with strong password validation
✅ User can login and stay logged in across page reloads
✅ Protected routes redirect to /auth when not authenticated
✅ User can select restaurant + date + time
✅ PaymentModal opens with booking summary
✅ User can enter credit card safely
✅ Payment processes with test Stripe card
✅ Booking confirmed and user redirected
✅ User receives confirmation email
✅ User can view booking in My Bookings
✅ User can logout

**Overall Status**: 🎯 **TIER 1 READY FOR TESTING**
