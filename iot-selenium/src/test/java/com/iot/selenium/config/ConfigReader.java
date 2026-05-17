package com.iot.selenium.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class ConfigReader {
    private static final String CONFIG_FILE = "config.properties";
    private final Properties properties = new Properties();

    public ConfigReader() {
        try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream(CONFIG_FILE)) {
            if (inputStream == null) {
                throw new IllegalStateException("Could not find " + CONFIG_FILE + " on the test classpath.");
            }
            properties.load(inputStream);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to load " + CONFIG_FILE + ".", exception);
        }
    }

    public String getBrowser() {
        return properties.getProperty("browser", "chrome").trim();
    }

    public String getBaseUrl() {
        return properties.getProperty("baseUrl", "http://localhost:4200").trim();
    }

    public String getApiBaseUrl() {
        return properties.getProperty("apiBaseUrl", "http://localhost:8080").trim();
    }

    public String getHomePath() {
        return properties.getProperty("homePath", "/home").trim();
    }

    public String getLoginPath() {
        return properties.getProperty("loginPath", "/login").trim();
    }

    public String getApiAuthLoginPath() {
        return properties.getProperty("apiAuthLoginPath", "/api/auth/login").trim();
    }

    public String getApiSensorsGeneratePath() {
        return properties.getProperty("apiSensorsGeneratePath", "/api/sensors/generate").trim();
    }

    public String getApiSensorsFlushPath() {
        return properties.getProperty("apiSensorsFlushPath", "/api/sensors/flush").trim();
    }

    public String getLoginEmail() {
        return properties.getProperty("loginEmail", "").trim();
    }

    public String getLoginPassword() {
        return properties.getProperty("loginPassword", "").trim();
    }

    public int getExplicitWaitSeconds() {
        return Integer.parseInt(properties.getProperty("explicitWait", "15").trim());
    }
}
