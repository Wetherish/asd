# 05 — Notifications

Visuals for iOS push and lock screen live in `03-ios.md` §Screen 8.
This doc covers **when, whether, and how** they are delivered.

---

## 1. What notifies

| Event | Notify | Why |
|-------|--------|-----|
| Approval needed | Always | Blocks real work. User is the only decider. |
| Task finished (≥ 10s) | Yes, if not watching | The user walked away. |
| Task finished (< 10s) | No | The result is already on screen. |
| Action failed | If unfocused, or retries exhausted | Failure the user can't see is a trust break. |
| Routine tool step | Never | Noise. It belongs in the tool chip. |
| Long-running progress | Live Activity only, no push | Progress is not an event. |
| Read-only action completed | Never | Expected, not news. |
| Marketing / tips / re-engagement | Never | Not in scope. Ever. |

**Suppression rule**
No notification if the app is foreground **and** that session is visible
and the relevant card is on screen. Check at delivery time, not at schedule time.

**Delay rule**
Finished tasks wait 3 seconds before firing. If the app gains focus in that
window, cancel. Approval notifications fire immediately.

---

## 2. Permission priming

Never prompt on first launch. Prompt at the first moment of value.

| Trigger | Prime |
|---------|-------|
| First task that ran >10s | "Get told when work finishes." |
| First approval request | "Approve from your lock screen." |
| Never | Cold start, onboarding, settings visit |

**Pre-prompt sheet**
```
Stay in the loop
We'll only notify you when something
finishes or needs your decision.
      [ Not now ]   [ Notify me ]
```
- Native prompt follows only on "Notify me".
- "Not now" → do not ask again for 14 days.
- Denied at the OS level → stop asking. Settings row becomes
  "Notifications are off" + "Open Settings".
- Windows: register the toast channel silently; same rules apply.

---

## 3. Throttling and coalescing

| Limit | Value |
|-------|-------|
| Per session | 1 per 60s |
| App-wide | 5 per hour |
| Approvals | Never throttled, but grouped above 3 |
| Supersede | Newer state replaces older for the same action |

- A "finished" that supersedes a "failed" replaces it, same identifier.
- Never queue notifications to deliver later. Drop and let the app show state.
- If a task is retried and finishes, only the final outcome notifies.

---

## 4. Grouping

- iOS `threadIdentifier` = session ID.
- 3+ finished from one session → one group: "3 updates · Weekly spending".
- Approvals never group with finished tasks, but group with each other at 4+.
- Desktop uses the same grouping rules in Notification Center / Action Center.
- Group collapses to the newest item. Expansion shows the rest.

---

## 5. Deep links

| Target | URL |
|--------|-----|
| Session | `assistant://session/{id}` |
| Approval card | `assistant://session/{id}?action={actionId}` |
| Dashboard | `assistant://dashboard/{id}` |
| Activity entry | `assistant://activity/{actionId}` |
| Connections | `assistant://connections` |
| Approval rules | `assistant://settings/approval-rules` |

**Action tokens**
- Approve links carry `?token=` — single-use, device-bound, 5-minute expiry.
- Reject needs no token but still resolves server-side.
- An expired token opens the card in `Expired` state, not an error screen.

---

## 6. Payload privacy

The lock screen is public. Treat every payload as visible to a stranger.

| Allowed | Banned |
|---------|--------|
| Action verb + object | Email body |
| Recipient **name** | Recipient address |
| Event title + time | Attendee list |
| Dashboard name + item count | Chart data |
| Error class ("Calendar access expired") | Raw error strings, IDs, stack traces |

- Body max 2 lines. Truncation by the OS is acceptable; secrets are not.
- Decryption happens in-app. Payload carries no content beyond the fields above.
- Settings → Notifications → "Show previews" maps to the OS preview setting.
  Default: when unlocked.

---

## 7. Desktop notifications

| | macOS | Windows |
|---|---|---|
| Surface | Notification Center banner | Action Center toast |
| Actions | hover-revealed, or `⌥` to expand | inline buttons |
| Auth | Touch ID for approve | Windows Hello for approve |
| Persistence | approvals until acted · finished 5s | same |
| Sound | system default only | system default only |

**Rules**
- Approve from a desktop toast requires biometrics when available.
  No biometrics → button opens the window focused on the card.
- Actions shown: Approve · Edit · Reject. Edit always opens the window.
- Toasts never stack more than 3. The rest group.
- No custom sounds. No app icon animation. No dock bounce.

### Toast copy
```
Assistant
Approval needed
Send email to Anna — Running late
[Approve]  [Edit]  [Reject]
```

---

## 8. Badges

| Surface | Badge shows |
|---------|-------------|
| iOS app icon | Pending approvals only |
| macOS dock | Pending approvals only |
| Windows taskbar | Pending approvals only |
| Sidebar / tabs | Pending + failed counts, separately |

- Not unread messages. Chat has no unread state.
- Cap display at `99+`.
- Clears on resolve. Never clears on app open alone.

---

## 9. Focus, DND, quiet hours

- Respect the OS. Do not request time-sensitive interruption for ordinary work.
- Approvals may use `timeSensitive` **only** if the underlying resource expires
  (slot taken, code valid for 2 min). Otherwise `active`.
- No bypass of silent mode. No custom alarm. No repeated nagging pings.
- In DND, notifications deliver silently and stay in the centre.
- In-app banner still appears if the app is open.

---

## 10. Failure modes

| Case | Behaviour |
|------|-----------|
| Permission denied | In-app banner once. Settings row explains. No repeated prompts. |
| Push service unreachable | Silent. In-app state is the source of truth. |
| Token expired on tap | Open card as `Expired` + "Ask again". |
| Duplicate on two devices | Resolve on one → best-effort dismiss elsewhere. |
| Approve fails after auth | Notification updates: "Couldn't approve. Open to retry." |
| App killed, approval tapped | Cold launch to the card, confirmed state, no flash of pending. |
| 4+ approvals pending | One grouped notification: "4 approvals waiting". |

---

## 11. Copy bank

| Type | Title | Body |
|------|-------|------|
| Approval — email | Approval needed | Send email to Anna — Running late |
| Approval — calendar | Approval needed | Create event — Lunch, Fri 1pm |
| Approval — destructive | Approval needed | Delete 3 events — Can't be undone |
| Finished — dashboard | Dashboard ready | Weekly spending · 12 categories |
| Finished — event | Lunch scheduled | Fri 14 Nov, 1:00 pm · Anna |
| Finished — message | Message sent | To Anna |
| Failure | Couldn't send email | To Anna — tap to retry |
| Auth expired | Calendar access expired | Reconnect to keep going |

**Banned:** "Task complete", "I've finished!", "Your assistant has…",
"Something went wrong", emoji, exclamation marks, motivational filler.

---

## 12. Accessibility

- Notification action buttons ≥ 44pt tall.
- VoiceOver order: app, title, body, time, actions.
- Never encode type by sound or colour alone — the title says "Approval needed".
- Haptics: `.success` for finished, `.warning` for approval. Nothing else.
- Large Text scales the in-app banner; the OS handles the notification.
- Approve action has an explicit label, not just an icon.
