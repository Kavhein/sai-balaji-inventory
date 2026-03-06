# Patient Data Consistency Audit

## 1. Orphaned Invoices (No linked Patient ID)
These invoices exist but aren't linked to any patient profile. They were likely orphaned during a patient deletion.

| Invoice # | Patient Name | Date | Total |
|---|---|---|---|
| SB/BIL/0012 | test | 2026-02-09T18:34:54.228Z | ₹19.3 |
| SB/BIL/0034 | test2 | 2026-02-09T18:35:27.601Z | ₹5.7 |
| SB/BIL/0086 | Saranya  | 2026-02-14T15:17:27.992Z | ₹1815 |
| SB/BIL/0092 | Devi | 2026-02-16T13:59:32.594Z | ₹61 |
| SB/BIL/0156 | Mumtaj | 2026-02-23T15:32:49.000Z | ₹900 |
| SB/BIL/0192 | Vanmathi  | 2026-02-27T15:55:40.000Z | ₹193 |
| SB/BIL/0193 | Vanmathi  | 2026-02-27T16:00:19.810Z | ₹1045 |
| SB/BIL/0233 | Kalai selvi  | 2026-03-04T14:16:50.000Z | ₹2479.63 |
| SB/BIL/0239 | Jeeva priya | 2026-03-05T15:36:46.000Z | ₹545 |
| SB/BIL/0099 | Gobi | 2026-02-16T15:31:02.523Z | ₹300 |

## 2. Orphaned Prescriptions (Linked to non-existent Patient)
No orphaned prescriptions found.

## 3. Potential Duplicate Patient Records (Same Mobile)
No duplicates found.

## 4. Patient Deletion Logs (Context for orphan creation)
| Date | Details | Role |
|---|---|---|
| 2026-03-05T15:37:41.073Z | Deleted Patient Record: Jeeva priya (Mobile: 8939178500). All associated personal data removed. | sister |
| 2026-03-05T14:17:37.582Z | Deleted Patient Record: Kalai selvi  (Mobile: 8122991581). All associated personal data removed. | sister |
| 2026-02-28T12:57:44.975Z | Deleted Patient Record: Vanmathi  (Mobile: 7200455274). All associated personal data removed. | admin |
| 2026-02-27T15:55:59.870Z | Deleted Patient Record: Vanmathi  (Mobile: 7200455274). All associated personal data removed. | admin |
| 2026-02-23T15:34:18.630Z | Deleted Patient Record: Mumtaj (Mobile: 9043701788). All associated personal data removed. | admin |
| 2026-02-16T14:00:29.589Z | Deleted Patient Record: Devi (Mobile: 8122800969). All associated personal data removed. | admin |
| 2026-02-14T15:49:20.969Z | Deleted Patient Record: Saranya  (Mobile: 9094996343). All associated personal data removed. | admin |
| 2026-02-09T18:35:38.524Z | Deleted patient: test2 (1234567890) | admin |
| 2026-02-09T18:35:10.894Z | Deleted patient: test (1234567890) | admin |
| 2026-02-07T16:34:44.230Z | Deleted patient: Inder (9840911436) | admin |
