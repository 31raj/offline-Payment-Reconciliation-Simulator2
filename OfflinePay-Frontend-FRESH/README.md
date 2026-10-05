IMPORTANT FIX — ONLINE/OFFLINE TRANSACTION FLOW

The frontend already has an Online/Offline toggle. Update the transaction creation flow so that the transaction status depends on the current connectivity state.

CURRENT PROBLEM:
When the system is ONLINE and I click "Generate Transaction", the transaction is currently being created with status QUEUED.

THIS IS WRONG.

REQUIRED BEHAVIOR:

ONLINE MODE:
Generate Transaction
→ POST /api/transactions
→ Transaction should immediately be synchronized
→ Status = SYNCED

OFFLINE MODE:
Go Offline
→ Generate Transaction
→ Transaction should be added to the offline queue
→ Status = QUEUED

WHEN CONNECTIVITY IS RESTORED:
Go Online
→ Click "Reconnect & Sync"
→ POST /api/sync
→ All QUEUED transactions become SYNCED

RECONCILIATION:
SYNCED
→ Reconcile
→ RECONCILED

Do not remove or break:
- Duplicate detection
- Conflict simulation
- Failed synchronization
- Retry behavior
- Audit logs
- Dashboard statistics
- Transaction details
- Demo fallback mode

IMPORTANT IMPLEMENTATION RULES:

1. Inspect the existing React code before modifying it.
2. Reuse the existing Online/Offline state instead of creating another connectivity state.
3. Reuse the existing API functions where possible.
4. Do not rewrite the entire project.
5. Make the minimum required changes.
6. Keep the current UI/design unchanged.
7. Do not delete existing MySQL data.
8. Do not change API URLs unnecessarily.

FRONTEND EXPECTATION:

If online:
createTransaction(...) should result in a SYNCED transaction.

If offline:
createTransaction(...) should result in a QUEUED transaction.

After creating a transaction, refresh:
- transactions
- dashboard statistics
- audit logs

Also make sure the UI correctly displays the backend status.

BACKEND EXPECTATION:

The backend currently creates transactions using status QUEUED.

Modify the backend API/service flow so it can distinguish between online and offline creation.

For example, the request can include:

{
  "transactionId": "TXN-123",
  "customerId": "CUST-1",
  "merchantId": "MERCHANT-1",
  "amount": 500,
  "offline": false
}

Behavior:

offline = false
→ status = SYNCED

offline = true
→ status = QUEUED

Use the existing architecture and make this change cleanly.

TEST THESE CASES AFTER IMPLEMENTATION:

TEST 1:
System ONLINE
→ Generate Transaction
→ Expected: SYNCED

TEST 2:
System OFFLINE
→ Generate Transaction
→ Expected: QUEUED

TEST 3:
System OFFLINE
→ Generate 3 transactions
→ Expected: all QUEUED

TEST 4:
Go ONLINE
→ Reconnect & Sync
→ Expected: all become SYNCED

TEST 5:
SYNCED transaction
→ Reconcile
→ Expected: RECONCILED

TEST 6:
Simulate Duplicate
→ Expected: DUPLICATE

TEST 7:
Simulate Conflict
→ Expected: CONFLICT

TEST 8:
Fail synchronization
→ Expected: FAILED

Do not finish until the ONLINE transaction no longer appears as QUEUED.
