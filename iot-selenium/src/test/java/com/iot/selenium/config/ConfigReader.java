package com.iot.selenium.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class ConfigReader {

    private static final String CONFIG_FILE = "config.properties";

    private final Properties properties = new Properties();

    public ConfigReader() {
        try (InputStream inputStream =
                     getClass().getClassLoader().getResourceAsStream(CONFIG_FILE)) {

            if (inputStream == null) {
                throw new IllegalStateException(
                        "Could not find " + CONFIG_FILE + " on the test classpath."
                );
            }

            properties.load(inputStream);

        } catch (IOException exception) {
            throw new IllegalStateException(
                    "Failed to load " + CONFIG_FILE + ".",
                    exception
            );
        }
    }

    public String getBrowser() {
        return getValue(
                "selenium.browser",
                "SELENIUM_BROWSER",
                "browser",
                "chrome"
        );
    }

    public String getBaseUrl() {
        return getValue(
                "selenium.baseUrl",
                "SELENIUM_BASE_URL",
                "baseUrl",
                "http://localhost:4200"
        );
    }

    public String getApiBaseUrl() {
        return getValue(
                "selenium.apiBaseUrl",
                "SELENIUM_API_BASE_URL",
                "apiBaseUrl",
                "http://localhost:8080"
        );
    }

    public String getLoginEmail() {
        return getValue(
                "selenium.loginEmail",
                "SELENIUM_LOGIN_EMAIL",
                "loginEmail",
                ""
        );
    }

    public String getLoginPassword() {
        return getValue(
                "selenium.loginPassword",
                "SELENIUM_LOGIN_PASSWORD",
                "loginPassword",
                ""
        );
    }

    public String getHomePath() {
        return getProperty("homePath", "/home");
    }

    public String getTrafficDashboardPath() {
        return getProperty("trafficDashboardPath", "/traffic-dashboard");
    }

    public String getAirQualityDashboardPath() {
        return getProperty(
                "airQualityDashboardPath",
                "/air-quality-dashboard"
        );
    }

    public String getStreetLightDashboardPath() {
        return getProperty(
                "streetLightDashboardPath",
                "/street-light-dashboard"
        );
    }

    public String getLoginPath() {
        return getProperty("loginPath", "/login");
    }

    public String getApiAuthLoginPath() {
        return getProperty("apiAuthLoginPath", "/api/auth/login");
    }

    public String getApiSensorsGeneratePath() {
        return getProperty(
                "apiSensorsGeneratePath",
                "/api/sensors/generate"
        );
    }

    public String getApiSensorsFlushPath() {
        return getProperty(
                "apiSensorsFlushPath",
                "/api/sensors/flush"
        );
    }

    public String getApiAlertsPath() {
        return getProperty("apiAlertsPath", "/api/alerts");
    }

    public int getExplicitWaitSeconds() {
        String value = getProperty("explicitWait", "15");

        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException exception) {
            throw new IllegalStateException(
                    "Invalid explicitWait value: " + value,
                    exception
            );
        }
    }

    /**
     * Precedence:
     * 1. JVM system property
     * 2. Environment variable
     * 3. config.properties
     * 4. Default value
     */
    private String getValue(
            String systemPropertyName,
            String environmentVariableName,
            String propertyName,
            String defaultValue
    ) {
        String systemProperty = System.getProperty(systemPropertyName);

        if (hasValue(systemProperty)) {
            return systemProperty.trim();
        }

        String environmentVariable = System.getenv(environmentVariableName);

        if (hasValue(environmentVariable)) {
            return environmentVariable.trim();
        }

        return getProperty(propertyName, defaultValue);
    }

    private String getProperty(String propertyName, String defaultValue) {
        return properties.getProperty(propertyName, defaultValue).trim();
    }

    private boolean hasValue(String value) {
        return value != null && !value.isBlank();
    }
}