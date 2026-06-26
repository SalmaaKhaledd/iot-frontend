package com.iot.selenium.tests;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import com.iot.selenium.config.ConfigReader;
import com.iot.selenium.pages.AlertsPage;
import com.iot.selenium.pages.SensorDashboardPage;
import com.iot.selenium.pages.SettingsPage;

import org.testng.Assert;
import org.testng.SkipException;
import org.testng.annotations.AfterClass;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

public class AlertsTest extends BaseTest {
    private static final String SHEET_NAME = "Alerts & Notifications";
    private static final long ALERT_POLL_TIMEOUT_MS = 20_000L;
    private static final long ALERT_POLL_INTERVAL_MS = 2_000L;

    private boolean driverInitialized = false;
    private String authToken;
    private AlertsPage alertsPage;
    private SensorDashboardPage sensorDashboardPage;
    private SettingsPage settingsPage;
    private ConfigReader configReader;

    @BeforeClass(alwaysRun = true)
    public void seedAlertsBeforeClass() {
        configReader = new ConfigReader();
        try {
            AlertsPage.flushSettingsPublic();
            AlertsPage.flushAlertsPublic();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to flush alert/settings data before class", e);
        }

        super.setUp();
        driverInitialized = true;
        alertsPage = new AlertsPage(driver);
        sensorDashboardPage = new SensorDashboardPage(driver);
        settingsPage = new SettingsPage(driver);

        restoreAuthenticatedSession();
        authToken = getSharedAuthToken();
        try {
            runFullAlertSeedingSequence();
        } catch (SkipException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to seed alerts before class", e);
        }
    }

    @BeforeMethod(alwaysRun = true)
    @Override
    public void setUp() {
        if (!driverInitialized) {
            super.setUp();
            driverInitialized = true;
        }
        if (configReader == null) {
            configReader = new ConfigReader();
        }
        alertsPage = new AlertsPage(driver);
        sensorDashboardPage = new SensorDashboardPage(driver);
        settingsPage = new SettingsPage(driver);
    }

    @AfterMethod(alwaysRun = true)
    @Override
    public void tearDown() {
        if (driver == null) {
            return;
        }
        // Do NOT call super.tearDown() — driver must stay alive across tests
    }

    @AfterClass(alwaysRun = true)
    public void tearDownClass() {
        driverInitialized = false;
        super.tearDown();
    }

    @Test(priority = 1)
    public void testPanelOpenClose() throws Exception {
        runPanelOpenCase("TC-AN01");
        runPanelCloseCase("TC-AN02");
    }

    @Test(priority = 2, dependsOnMethods = "testPanelOpenClose")
    public void testEmptyNotifications() throws Exception {
        AlertsPage.deleteAllAlerts(authToken);
        runEmptyStateCase("TC-AN03");
        runBadgeHiddenCase("TC-AN04");
    }

    @Test(priority = 3, dependsOnMethods = "testEmptyNotifications")
    public void testSeededNotifications() throws Exception {
        reseedAlertsAfterEmptyState();
        runBadgeVisibleCase("TC-AN05");
        runAlertCardListedCase("TC-AN06");
    }

    @Test(priority = 4, dependsOnMethods = "testSeededNotifications")
    public void testJumpToSensorModal() throws Exception {
        runJumpToModalCase("TC-AN07");
    }

    @Test(priority = 5, dependsOnMethods = "testJumpToSensorModal")
    public void testDeleteFromModal() throws Exception {
        runDeleteFromModalCase("TC-AN09");
    }

    @Test(priority = 6, dependsOnMethods = "testPanelOpenClose")
    public void testPanelOnSettingsRoute() throws Exception {
        runPanelOnRouteCase("TC-AN12");
    }

    private void runFullAlertSeedingSequence() throws Exception {
        refreshAlertsFromSensors();
    }

    private void reseedAlertsAfterEmptyState() throws Exception {
        refreshAlertsFromSensors();
    }

    private void refreshAlertsFromSensors() throws Exception {
        if (authToken == null || authToken.isBlank()) {
            authToken = getSharedAuthToken();
        }
        AlertsPage.seedTrafficDensityAboveThreshold(authToken);
        for (int i = 0; i < 3; i++) {
            AlertsPage.generateSensorsPublic();
        }

        alertsPage.navigateToHome();
        sensorDashboardPage.waitForSectionDataDisplayed("traffic");
        sensorDashboardPage.clickRefresh("traffic");
        sensorDashboardPage.waitForSectionDataDisplayed("traffic");

        List<String> alertIds = AlertsPage.pollAlertIdsUntilMinCount(
                authToken, 1, ALERT_POLL_TIMEOUT_MS, ALERT_POLL_INTERVAL_MS);
        if (alertIds.isEmpty()) {
            throw new SkipException(
                    "Seeding failed — no alerts in DB after threshold + generate + refresh. Run aborted.");
        }
    }

    private void runPanelOpenCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        alertsPage.navigateToHome();
        alertsPage.clickNotificationsBell();
        alertsPage.waitForPanelVisible();
        Assert.assertTrue(alertsPage.isPanelVisible(), "[" + tcId + "] Expected notification panel to be visible");
        Assert.assertEquals(
                alertsPage.getPanelTitleText(),
                data.get("expectedTitle"),
                "[" + tcId + "] Unexpected panel title");
    }

    private void runPanelCloseCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        alertsPage.navigateToHome();
        alertsPage.clickNotificationsBell();
        alertsPage.waitForPanelVisible();
        alertsPage.clickClosePanel();
        alertsPage.waitForPanelClosed();
        Assert.assertFalse(alertsPage.isPanelVisible(), "[" + tcId + "] Expected notification panel to close");
    }

    private void runEmptyStateCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        alertsPage.navigateToHome();
        alertsPage.clickNotificationsBell();
        alertsPage.waitForPanelVisible();
        Assert.assertTrue(
                alertsPage.isEmptyStateDisplayed(),
                "[" + tcId + "] Expected empty state to be displayed");
        Assert.assertEquals(
                alertsPage.getEmptyStateText(),
                data.get("expectedEmpty"),
                "[" + tcId + "] Unexpected empty state message");
        Assert.assertEquals(
                alertsPage.getPanelAlertCardCount(),
                0,
                "[" + tcId + "] Expected no alert cards in panel");
    }

    private void runBadgeHiddenCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        alertsPage.navigateToHome();
        boolean expectedVisible = Boolean.parseBoolean(data.get("expectedBadgeVisible"));
        Assert.assertEquals(
                alertsPage.isBadgeVisible(),
                expectedVisible,
                "[" + tcId + "] Unexpected badge visibility");
    }

    private void runBadgeVisibleCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        ensureAlertsPresent(tcId, data);
        alertsPage.navigateToHome();
        boolean expectedVisible = Boolean.parseBoolean(data.get("expectedBadgeVisible"));
        if (expectedVisible) {
            sensorDashboardPage.clickRefresh("traffic");
            alertsPage.waitForBadgeVisible(true, 20);
        }
        Assert.assertEquals(
                alertsPage.isBadgeVisible(),
                expectedVisible,
                "[" + tcId + "] Expected unread badge to be visible");
    }

    private void runAlertCardListedCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        int minCards = Integer.parseInt(data.get("minAlertCards"));
        ensureAlertsPresent(tcId, data);
        alertsPage.navigateToHome();
        alertsPage.clickNotificationsBell();
        alertsPage.waitForPanelVisible();
        int count = alertsPage.getPanelAlertCardCount();
        Assert.assertTrue(count >= minCards, "[" + tcId + "] Expected at least " + minCards + " alert cards");
    }

    private void runJumpToModalCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        String sensorType = data.get("sensorType");
        ensureAlertsPresent(tcId, data);
        alertsPage.navigateToHome();
        alertsPage.clickNotificationsBell();
        alertsPage.waitForPanelVisible();
        Assert.assertTrue(
                alertsPage.getPanelAlertCardCount() >= 1,
                "[" + tcId + "] Expected at least one alert card in panel");
        alertsPage.clickPanelAlertCardBySensorType(sensorType);
        alertsPage.waitForPanelClosed();
        Assert.assertFalse(alertsPage.isPanelVisible(), "[" + tcId + "] Expected panel to close after jump");
        alertsPage.waitForSensorModalVisible(sensorType);
        Assert.assertTrue(
                alertsPage.isSensorModalVisible(sensorType),
                "[" + tcId + "] Expected " + sensorType + " alerts modal to open");
    }

    private void runDeleteFromModalCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        String sensorType = data.getOrDefault("sensorType", data.get("section"));
        Assert.assertNotNull(
                sensorType,
                "[" + tcId + "] Test Data Used must define sensorType (or section)");
        ensureAlertsPresent(tcId, data);
        alertsPage.navigateToHome();
        alertsPage.clickNotificationsBell();
        alertsPage.waitForPanelVisible();
        Assert.assertTrue(
                alertsPage.getPanelAlertCardCount() >= 1,
                "[" + tcId + "] Expected at least one alert card to open modal");
        alertsPage.clickPanelAlertCardBySensorType(sensorType);
        alertsPage.waitForSensorModalVisible(sensorType);
        int before = alertsPage.getSensorModalAlertCardCount(sensorType);
        Assert.assertTrue(before >= 1, "[" + tcId + "] Expected at least one alert in modal to delete");
        alertsPage.clickDeleteFirstAlertInModal(sensorType);
        alertsPage.waitForSensorModalAlertCount(sensorType, before - 1);
        Assert.assertEquals(
                alertsPage.getSensorModalAlertCardCount(sensorType),
                before - 1,
                "[" + tcId + "] Card removed from modal list");
    }

    private void runPanelOnRouteCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        alertsPage.navigateTo(data.get("route"));
        alertsPage.clickNotificationsBell();
        alertsPage.waitForPanelVisible();
        Assert.assertTrue(alertsPage.isPanelVisible(), "[" + tcId + "] Expected panel on " + data.get("route"));
        Assert.assertEquals(
                alertsPage.getPanelTitleText(),
                data.get("expectedTitle"),
                "[" + tcId + "] Unexpected panel title on settings route");
    }

    private void ensureAlertsPresent(String tcId, Map<String, String> data) throws Exception {
        int minCards = data.containsKey("minAlertCards")
                ? Integer.parseInt(data.get("minAlertCards"))
                : 1;
        authToken = alertsPage.getAuthTokenFromLocalStorage();
        if (AlertsPage.fetchAlertIds(authToken).size() >= minCards) {
            return;
        }

        if (data.containsKey("requires") && "air_quality_threshold".equals(data.get("requires"))) {
            settingsPage.navigateToSettings();
            settingsPage.clickThresholdsTab();
            settingsPage.enterThresholdValue(
                    data.get("airThresholdPlaceholder"), data.get("airThresholdValue"));
            settingsPage.clickSaveChanges();
            if (settingsPage.isValidationAlertPresent()) {
                throw new IllegalStateException(
                        "[" + tcId + "] Air quality threshold save blocked by browser alert: "
                                + settingsPage.getValidationAlertText());
            }
            sensorDashboardPage.navigateToHome();
            sensorDashboardPage.waitForSectionDataDisplayed("air");
            sensorDashboardPage.clickRefresh("air");
            sensorDashboardPage.waitForSectionDataDisplayed("air");
            List<String> ids = AlertsPage.pollAlertIdsUntilMinCount(
                    authToken, minCards, ALERT_POLL_TIMEOUT_MS, ALERT_POLL_INTERVAL_MS);
            if (ids.size() < minCards) {
                throw new SkipException(
                        "[" + tcId + "] Need at least " + minCards + " alerts from API; got " + ids.size());
            }
            return;
        }

        throw new SkipException(
                "[" + tcId + "] Expected at least " + minCards + " alerts after class seeding; none found");
    }

    private Map<String, String> rowByTcId(String tcId) {
        return Arrays.stream(rowsForSheet(SHEET_NAME))
                .map(this::rowData)
                .filter(rd -> tcId.equals(rd.get("tc_id")))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Row not found for tc_id: " + tcId));
    }

}
