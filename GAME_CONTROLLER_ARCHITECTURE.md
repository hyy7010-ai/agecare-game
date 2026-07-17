# Sunrise Care Resident Game Architecture

## Product decision

Every production resident game is a two-screen shared activity:

1. **Desktop or tablet — Game World**
   - Shows Sunny, scenery, animation, one instruction at a time, and simple progress.
   - Does not require gameplay clicks or small controls.
2. **Resident smartphone — Accessible Controller**
   - Shows one or two extremely large action buttons plus a clearly separated Exit control.
   - Supports portrait and landscape orientation and one-finger use.

Games must feel calm, companion-led, and cooperative. Product copy must not make therapeutic,
cognitive, dementia, attention, or medical claims.

## Session flow

1. Sunny recommends an activity from the resident's explicit request or saved preference.
2. The large display creates a short-lived game session and shows a QR code and simple pairing code.
3. The resident or helper opens the controller link on the phone and joins the session.
4. Both screens show an honest `Connected` state only after the session handshake succeeds.
5. Phone actions are sent as ordered, idempotent controller events.
6. The game world responds visually and Sunny gives a short visible/spoken acknowledgement.
7. Either device can end the activity safely.
8. Only observable session facts are saved, such as duration, actions, completion, replay, and
   explicit resident feedback.

## Controller contract

- One or two primary actions only.
- Minimum touch target: 96 × 96 CSS pixels; primary actions should occupy at least 35% of the
  available controller viewport.
- Portrait and landscape layouts are mandatory.
- No swipe, drag, multi-touch, long-press, or timing-sensitive gestures.
- High contrast, large text, icon plus label, and visible focus states.
- Every action has a visible acknowledgement and an optional short spoken label.
- Exit is always available but visually separated from gameplay actions.
- Camera, microphone, accelerometer, and raw motion data are not required.
- Events include a session ID and increasing sequence number so duplicate taps can be handled safely.

## Large-display contract

- Mouse or trackpad input is not required for normal play.
- The large display presents one clear instruction at a time.
- If the controller disconnects, the world pauses gently and shows reconnection guidance.
- There are no mandatory countdowns, competitive leaderboards, or failure language.
- Saved summaries contain observable facts only and never infer emotion, cognition, or health.

## Proposed transport boundary

The first implementation may reuse Firestore for a short-lived session document and ordered action
events, with a local same-network/demo adapter behind the same interface. Production work must add
authenticated pairing, expiring random session IDs, strict Firestore rules, reconnect handling, and
rate limits. No raw audio or device sensor data is stored.

## Current implementation status

**Flower Memory Match now implements this architecture end to end.** Its large display creates an
expiring session and pauses until a phone completes the QR/pairing-code handshake. The phone route
`/controller/flower-match` provides two actions (`Next flower` and `Choose flower`) plus a separated
Exit control. Events carry the random session ID and an increasing sequence number; duplicate
delivery is acknowledged without replaying the action. Heartbeats move the display into a gentle
reconnecting state when the phone is unavailable and restore the session when it returns.

The other browser-click games remain interaction prototypes. They do **not** satisfy this production
architecture and must not be presented as final resident controller games until each is migrated.

### Flower Memory implementation evidence

- Separate display and controller: `FlowerMemoryMatch.tsx` and `FlowerMatchController.tsx`.
- Session transport: `/api/game-sessions` routes backed by `ResidentGameSessionStore`.
- Controller actions: two primary buttons, each at least 112px high in tested phone layouts.
- Orientation checks: 390 × 844 portrait and 844 × 390 landscape, with no viewport overflow.
- Pairing/reconnect/duplicate/expiry/exit states: implemented and covered by session-store tests.
- Normal play on the large display does not require mouse or touch input.

## Ready-for-build checklist

A resident game is ready for implementation only when:

- its large-display world and phone controller are designed separately;
- it has no more than two controller actions;
- both controller orientations and common phone sizes are tested;
- pairing, reconnect, duplicate-event, offline, and exit states are specified;
- accessibility and security have been reviewed; and
- a resident or helper can start it without navigating a complex menu.
