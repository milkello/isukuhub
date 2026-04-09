# Real-time Notifications - Examples & How They Work

## 📱 Notification Types & Examples

### 1. 🚚 **Collection Status Updates**
**When**: When waste collection status changes
**Who receives**: Agent assigned to collection + Household user + Admin

**Example Notifications**:

```
🔔 New Collection Update
Collection #COL-847392 is now IN PROGRESS
Agent: agent-23 is heading to your location
Estimated arrival: 2:30 PM

View Details →
```

```
🔔 Collection Completed!
Collection #COL-847392 has been COMPLETED
Waste collected: 45kg
Payment processed: $12.50

Rate Collection →
```

### 2. 💳 **Transaction Updates**
**When**: Payments, purchases, or sales are processed
**Who receives**: User who made transaction + Admin

**Example Notifications**:

```
🔔 Payment Processed
Your payment of $45.00 has been COMPLETED
Transaction ID: TXN-928374
Thank you for your subscription!

View Receipt →
```

```
🔔 New Sale Recorded
Your material sale has been COMPLETED
Material: Plastic (25kg)
Amount: $18.75
Transaction ID: TXN-928375

View Details →
```

### 3. 📢 **System Notifications**
**When**: Important system announcements
**Who receives**: All users or specific roles

**Example Notifications**:

```
🔔 System Update
New features have been added to the platform
• Real-time notifications
• Live dashboard updates
• Mobile app improvements

Learn More →
```

```
🔔 Route Optimization
Collection routes have been optimized for efficiency
New routes will save 15% fuel consumption
Effective immediately

View Routes →y

```

```
🔔 Maintenance Notice
Scheduled maintenance tonight at 11:00 PM
Expected downtime: 30 minutes
Please save your work

Set Reminder →
```

### 4. 📈 **Price Change Alerts**
**When**: Material prices fluctuate significantly
**Who receives**: Recyclers + Investors + Admin

**Example Notifications**:

```
🔔 Price Alert: Plastic
Price increased by +8.2%
Old: $0.50/kg → New: $0.54/kg
Time to sell: Now!

View Market →
```

```
🔔 Price Alert: Metal
Price decreased by -3.1%
Old: $1.20/kg → New: $1.16/kg
Consider holding for better prices

View Trends →
```

---

## 🔧 **How Real-time System Works**

### **Connection Flow**:
1. **User logs in** → SSE connection established (`/api/events?userId=user-123`)
2. **Event occurs** → System emits event via `realtimeManager`
3. **Event routing** → Sent to specific users/roles based on event type
4. **Client receives** → Browser updates UI in real-time
5. **Notification appears** → User sees instant notification

### **Event Broadcasting Logic**:

```typescript
// Collection update example
realtimeManager.emitCollectionUpdate({
  collectionId: "COL-847392",
  status: "in_progress", 
  agentId: "agent-23",
  householdId: "household-45",
  timestamp: "2026-04-08T14:30:00Z"
})

// This automatically sends to:
// - Assigned agent (agent-23)
// - Household user (household-45) 
// - All admin users
```

### **UI Update Flow**:

1. **Event Received** → SSE connection gets event
2. **State Update** → React component state updates
3. **Visual Feedback** → Notification appears with icon + animation
4. **Badge Update** → Unread count increments
5. **Dashboard Refresh** → Live stats update automatically

---

## 🎯 **User Experience**

### **Immediate Feedback**:
- ✅ **Instant notifications** - No page refresh needed
- ✅ **Visual indicators** - Badge shows unread count
- ✅ **Contextual actions** - Relevant buttons per notification type
- ✅ **Time awareness** - "Just now", "2m ago", etc.

### **Smart Targeting**:
- 🎯 **User-specific** - Only relevant users get notifications
- 🎯 **Role-based** - Agents get collection updates, Admins get everything
- 🎯 **Priority levels** - Critical alerts vs. informational updates

### **Rich Interactions**:
- 📱 **Mobile-friendly** - Works on all devices
- 🔄 **Auto-refresh** - Dashboard updates without manual reload
- 💾 **Persistent** - Notifications stored during session
- ❌ **Easy dismissal** - Mark as read or clear all

---

## 🧪 **Testing Real-time Features**

### **Manual Testing**:
```bash
# Test collection updates
curl -X POST http://localhost:3000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{"eventType": "collection_update", "count": 3}'

# Test transaction updates  
curl -X POST http://localhost:3000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{"eventType": "transaction_update", "count": 2}'

# Test system notifications
curl -X POST http://localhost:3000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{"eventType": "system_notification", "count": 1}'
```

### **Live Testing**:
1. **Open admin dashboard** → `http://localhost:3000/admin`
2. **Login as different users** → Multiple browser tabs
3. **Trigger events** → Use simulation API
4. **Observe updates** → See real-time notifications appear

---

## 📊 **Real-time Dashboard Integration**

### **Live Stats Example**:
```
📊 Real-time Updates
┌─────────────────────────────────────────┐
│ Total Collections:    1,234      │
│ Active Collections:     23         │  
│ Completed Today:        156        │
│ Total Revenue:      $24,500     │
└─────────────────────────────────────────┘

🚚 Recent Collections:
• Collection #847392 - In Progress (2m ago)
• Collection #847391 - Completed (15m ago)  
• Collection #847390 - Scheduled (1h ago)

💳 Recent Transactions:
• Sale - $18.75 (5m ago) ✓
• Payment - $45.00 (12m ago) ✓
• Purchase - $120.00 (1h ago) ⏳

📈 Price Updates:
• Plastic +8.2% → $0.54/kg (3m ago)
• Metal -3.1% → $1.16/kg (8m ago)
```

### **Visual Indicators**:
- 🟢 **Live indicator** - Pulsing green dot
- 📊 **Auto-updating charts** - No refresh needed
- 🔔 **Notification badge** - Red dot for unread
- ⚡ **Instant updates** - Smooth animations

---

## 🎉 **Expected User Benefits**

### **For Households**:
- 📍 **Track collection status** - Know when waste is picked up
- 💰 **Payment confirmations** - Instant payment receipts
- 📅 **Schedule reminders** - Never miss collection day

### **For Agents**:
- 🗺 **Route optimization** - Real-time route changes
- 📱 **Customer updates** - Instant household notifications
- 📊 **Performance metrics** - Live completion rates

### **For Recyclers**:
- 💹 **Price alerts** - Buy/sell at optimal times
- 📈 **Market trends** - Real-time price movements
- 🤝 **Transaction confirmations** - Instant deal notifications

### **For Admins**:
- 🎛️ **System monitoring** - All platform events
- 📊 **Live analytics** - Real-time metrics
- 🔔 **Critical alerts** - Immediate issue notifications

---

**The real-time system transforms the waste management platform from static to dynamic, providing immediate value to all user types!** 🌟
