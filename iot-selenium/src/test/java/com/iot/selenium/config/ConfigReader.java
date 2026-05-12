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
}