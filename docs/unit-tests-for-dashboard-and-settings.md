# Unit Test Coverage

The Angular unit tests in this workspace now cover the main sensor widgets, alert panels, shared notifications, settings, and profile logout flow.

## Covered Areas

- Air quality sensor card state, width helpers, and sensor selection.
- Traffic sensor card chart projection, hover handling, and sensor selection.
- Street light card brightness updates, clamping, and aggregate metrics.
- Air quality alerts filtering and color mapping.
- Traffic alerts filtering and color mapping.
- Street light alerts filtering and color mapping.
- Notification panel unread count, open/close behavior, outside-click handling, and icon helpers.
- Settings page navigation, deactivation guard, dirty-state updates, and threshold management.
- Profile page logout flow, including session clearing and redirect behavior.

## Run

From `iot-frontend`, run:

```bash
npm test
```

If you want a narrower check while iterating, run the specific spec file through the Angular test runner configured in the workspace.