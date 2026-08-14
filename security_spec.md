# Security Specification for Editora NPE Proposals

This document outlines the Security Test-Driven Development (TDD) blueprint for the Google Firestore rules integration.

## 1. Data Invariants
- **Costs (`costs`)**: Every cost must have a positive unique `id`, a descriptive text `description`, and a numeric `value`.
- **Rates (`rates`)**: Every rate must have a positive unique `id`, a descriptive text `description`, and a numeric `percentage` (0-100%).
- **Supplies (`supplies`)**: Every supply must have a positive unique `id`, a descriptive `description`, a valid `unit` string (like 'lauda', 'unidade', 'hora', etc.), and a positive numeric `cost`.
- **Processes (`processes`)**: Every process must have a positive unique `id`, an `action` string, a `unit` string, and a positive numeric `time`.
- **Statuses (`statuses`)**: Every status must have a positive unique `id`, a string `name`, and an integer `order` representing its position in the Kanban funil.
- **Proposals (`proposals`)**: Every proposal must have a positive unique `id`, a customer/proposal `name`, a valid `date`, an array of elements in `items`, and positive numbers for `totalCost` and `sellPrice`, as well as a valid `status` matching one of the Kanban stages.

---

## 2. The "Dirty Dozen" (12 Malicious Payloads)
The following payloads should be blocked by Firestore security rules:

1. **ID Poisoning in Costs**: Creating a cost with an overly long ID filled with junk chars (`/costs/very_long_junk_string_to_cause_resource_exhaustion...`).
2. **Shadow Field Injection in Costs**: Creating a cost document with a hidden flag (e.g. `isAdmin: true` or `unauthorizedField: "hacked"`).
3. **Invalid Value Type in Costs**: Saving `'thousand'` as value instead of a Float/Integer.
4. **Out of Bound Percentage in Rates**: Saving a rate with a `percentage` of `-5` or `150`.
5. **Rate Name Poisoning**: Injecting HTML/JS code into a rate description (`"<script>alert(1)</script>"`).
6. **Supply Price Poisoning**: Saving of a negative unit cost on a supply (`cost: -150.00`).
7. **Process Time Type Poisoning**: Attempting to save a non-numeric `time` field in a process document.
8. **Status Name Injection**: Attempting to update a status stage name with more than 1MB of text.
9. **Orphaned Status Deletion**: Allowing unauthenticated delete on Kanban Status definitions.
10. **Malicious Proposal Price Manipulation**: Changing `sellPrice` of a Proposal bypassing regular calculations.
11. **Client-Controlled User Privilege Spoofing**: Attempting to create an administrative claim field directly from the client.
12. **Null/Missing Item Array on Proposal**: Attempting to create a proposal with `items` set to `null` or a primitive instead of an array.

---

## 3. Test Cases (firestore.rules)
Below is the outline of expected permission denials on the above actions. We will enforce these restrictions through our Firebase security rules.
