package com.iot.selenium.utils;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import com.iot.selenium.pages.AlertsPage;
import com.iot.selenium.pages.SettingsPage;

public class SeleniumRunContext {
    private final String runId = UUID.randomUUID().toString();
    private final String bearerToken;
    private Set<String> baselineAlertIds = Set.of();
    private Set<String> baselineSettingIds = Set.of();

    public SeleniumRunContext(String bearerToken) {
        if (bearerToken == null || bearerToken.isBlank()) {
            throw new IllegalArgumentException("bearerToken is required for scoped Selenium cleanup.");
        }
        this.bearerToken = bearerToken;
    }

    public String getRunId() {
        return runId;
    }

    public void captureAlertBaseline() throws Exception {
        baselineAlertIds = new HashSet<>(AlertsPage.fetchAlertIds(bearerToken));
    }

    public void captureSettingBaseline() throws Exception {
        baselineSettingIds = new HashSet<>(SettingsPage.fetchSettingIds(bearerToken));
    }

    public void captureBaseline() throws Exception {
        captureAlertBaseline();
        captureSettingBaseline();
    }

    public void cleanupCreatedAlerts() throws Exception {
        for (String alertId : AlertsPage.fetchAlertIds(bearerToken)) {
            if (!baselineAlertIds.contains(alertId)) {
                AlertsPage.deleteAlert(bearerToken, alertId);
            }
        }
    }

    public void cleanupCreatedSettings() throws Exception {
        for (String settingId : SettingsPage.fetchSettingIds(bearerToken)) {
            if (!baselineSettingIds.contains(settingId)) {
                SettingsPage.deleteSetting(bearerToken, settingId);
            }
        }
    }

    public void cleanupCreatedData() throws Exception {
        cleanupCreatedAlerts();
        cleanupCreatedSettings();
    }
}
