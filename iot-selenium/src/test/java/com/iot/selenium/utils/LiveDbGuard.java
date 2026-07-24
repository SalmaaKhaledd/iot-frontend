package com.iot.selenium.utils;

public final class LiveDbGuard {
    private static final String LIVE_DB_PROPERTY = "selenium.liveDb";
    private static final String LIVE_DB_ENV = "SELENIUM_LIVE_DB";
    private static final String LIVE_SUITE_PROPERTY = "selenium.liveSuite";
    private static final String LIVE_SUITE_ENV = "SELENIUM_LIVE_SUITE";

    private LiveDbGuard() {
    }

    public static boolean isLiveDb() {
        return isTruthy(System.getProperty(LIVE_DB_PROPERTY))
                || isTruthy(System.getenv(LIVE_DB_ENV));
    }

    public static void requireLiveSafeSuite() {
        if (!isLiveDb()) {
            return;
        }

        if (isTruthy(System.getProperty(LIVE_SUITE_PROPERTY))
                || isTruthy(System.getenv(LIVE_SUITE_ENV))) {
            return;
        }

        throw new IllegalStateException(
                "SELENIUM_LIVE_DB=true requires the live-sanity profile/suite. "
                        + "Refusing to run a non-live-safe suite against a live database.");
    }

    public static void denyOnLiveDb(String operation) {
        if (!isLiveDb()) {
            return;
        }

        throw new IllegalStateException(
                "Refusing Selenium live-DB mutation while SELENIUM_LIVE_DB=true: " + operation);
    }

    private static boolean isTruthy(String value) {
        if (value == null) {
            return false;
        }

        return switch (value.trim().toLowerCase()) {
            case "true", "1", "yes", "y", "on" -> true;
            default -> false;
        };
    }
}
