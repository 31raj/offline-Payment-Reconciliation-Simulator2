# ⚡ OfflinePay — Offline Payment Reconciliation Simulator

> A FinTech simulation platform that enables reliable transaction processing and reconciliation during network outages or temporary connectivity loss.

OfflinePay simulates how payment transactions can be created while offline, securely queued, synchronized when connectivity returns, and finally reconciled against server-side records.

---

## 🚀 Problem

Payment systems can temporarily lose connectivity due to:

- Network outages
- Poor connectivity
- Server downtime
- Temporary disconnection
- Unstable payment infrastructure

During these situations, transactions still need to be recorded safely without creating duplicate or inconsistent financial records.

OfflinePay demonstrates how such transactions can be **queued, synchronized, verified, and reconciled** once connectivity is restored.

---

## 💡 Solution

OfflinePay provides a controlled simulation of an offline-first payment infrastructure.

### Core Flow

```text
Transaction Creation
        ↓
Online / Offline Detection
        ↓
 ┌───────────────┐
 │               │
Online        Offline
 │               │
 ↓               ↓
SYNCED        QUEUED
 │               │
 └───────┬───────┘
         ↓
   Reconnect & Sync
         ↓
       SYNCED
         ↓
    Reconciliation
         ↓
 ┌────────┬──────────┬──────────┐
 │        │          │          │
MATCHED DUPLICATE  CONFLICT   FAILED
 │
 ↓
RECONCILED
