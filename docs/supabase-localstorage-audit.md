# PLANES localStorage audit

No `sessionStorage` usage was found.

| Key | Stored data | Readers/writers | Classification | Supabase target |
| --- | --- | --- | --- | --- |
| `planes:users:v1` | Local users, email, name, password hash | `client-auth.ts` | Legacy authentication; must be removed | Supabase Auth |
| `planes:session:v1` | Current local user session | `client-auth.ts`, route guards | Legacy authentication; must be removed | Supabase Auth session |
| `planes:day-page:v1` | Selected month and tasks grouped by date, including `done` checks | Day page | User business data | `planner_documents` / `day` |
| `planes:week-page:v1` | Week date, tasks, marks, hidden tasks, focus and notes | Week page | User business data | `planner_documents` / `week` |
| `planes:month-page:v1` | Month date, tasks, marks, hidden tasks, focus and notes | Month page | User business data | `planner_documents` / `month` |
| `planes:year-goals:v1` | Goal text and completion checks | Year goals page | User business data | `planner_documents` / `year_goals` |
| `planes:focus-page:v1` | Timer state and completed focus sessions | Focus page | User business data | `planner_documents` / `focus` |
| `planes-expenses-tracker` | Income and expense records and their checks | Expenses, indicators, notifications | User business data | `finance_records` |
| `planes-savings-debts-tracker` | Savings/debt records, checks and closed state | Savings/debts, indicators, notifications | User business data | `savings_debt_records` |
| `planes:settings:v1` | Name, base64 photo, theme, language, currency and notification preferences | Settings and layout components | Mixed profile and preferences | `profiles`, private `avatars` bucket, `user_settings` |
| `planes-expenses-currency` | Display currency | Expenses page | UI preference | `user_settings` |
| `planes-expenses-selected-month` | Currently selected month | Expenses page | Temporary UI state | May remain local |
| `planes-savings-debts-currency` | Display currency | Savings/debts page | UI preference | `user_settings` |
| `planes-savings-debts-selected-month` | Currently selected month | Savings/debts page | Temporary UI state | May remain local |
| `planes-indicators-selected-month` | Currently selected analytics month | Indicators page | Temporary UI state | May remain local |
| `planes-notifications-email-digest-sent:{date}` | Local daily notification marker | Notification bridge | Temporary device state | May remain local |
| `planes-notifications-push-digest-sent:{date}` | Local daily notification marker | Notification bridge | Temporary device state | May remain local |

The existing implementation remains active until a real Supabase project is
configured and the remote persistence integration has been verified.
