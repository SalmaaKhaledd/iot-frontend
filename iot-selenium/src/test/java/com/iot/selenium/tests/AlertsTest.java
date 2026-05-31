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
    private static final String TRAFFIC_DENSITY_PLACEHOLDER = "Enter a value between 0 to 500";
    private static final String ABOVE_CONDITION_LABEL = "Above";
    private static final long ALERT_POLL_TIMEOUT_MS = 20_000L;
    private static final long ALERT_POLL_INTERVAL_MS = 2_000L;

    private boolean driverInitialized = false;
    private String authToken;
    private AlertsPage alertsPage;
    private SensorDashboardPage sensorDashboardPage;
    private SettingsPage settingsPage;
    private ConfigReader configReader;

    @BeforeClass(alwaysRun = true)
    public void seedAlertsBeforeClass() throws Exception {
        configReader = new ConfigReader();

        AlertsPage.flushSettingsPublic();
        AlertsPage.flushAlertsPublic();

        super.setUp();
        driverInitialized = true;
        alertsPage = new AlertsPage(driver);
        sensorDashboardPage = new SensorDashboardPage(driver);
        settingsPage = new SettingsPage(driver);

        login(configReader.getLoginEmail(), configReader.getLoginPassword());
        runFullAlertSeedingSequence();
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
        runJumpToModalCase("TC-AN08");
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
        settingsPage.navigateToSettings();
        settingsPage.clickThresholdsTab();
        settingsPage.waitForDefaultThresholdState(TRAFFIC_DENSITY_PLACEHOLDER);
        settingsPage.enterThresholdValue(TRAFFIC_DENSITY_PLACEHOLDER, "1");
        ensureTrafficDensityAboveCondition();
        settingsPage.clickSaveChanges();
        if (settingsPage.isValidationAlertPresent()) {
            throw new IllegalStateException(
                    "Traffic Density threshold save blocked by browser alert: "
                            + settingsPage.getValidationAlertText());
        }

        refreshAlertsFromSensors();
    }

    private void reseedAlertsAfterEmptyState() throws Exception {
        refreshAlertsFromSensors();
    }

    private void refreshAlertsFromSensors() throws Exception {
        AlertsPage.generateSensorsPublic();

        alertsPage.navigateToHome();
        sensorDashboardPage.waitForSectionDataDisplayed("traffic");
        sensorDashboardPage.clickRefresh("traffic");
        sensorDashboardPage.waitForSectionDataDisplayed("traffic");

        authToken = alertsPage.getAuthTokenFromLocalStorage();
        List<String> alertIds = AlertsPage.pollAlertIdsUntilMinCount(
                authToken, 1, ALERT_POLL_TIMEOUT_MS, ALERT_POLL_INTERVAL_MS);
        if (alertIds.isEmpty()) {
            throw new SkipException(
                    "Seeding failed — no alerts in DB after threshold + generate + refresh. Run aborted.");
        }
    }

    private void ensureTrafficDensityAboveCondition() {
        if (ABOVE_CONDITION_LABEL.equals(settingsPage.getConditionButtonText(TRAFFIC_DENSITY_PLACEHOLDER))) {
            return;
        }
        settingsPage.clickConditionButton(TRAFFIC_DENSITY_PLACEHOLDER);
        if (!ABOVE_CONDITION_LABEL.equals(settingsPage.getConditionButtonText(TRAFFIC_DENSITY_PLACEHOLDER))) {
            throw new IllegalStateException(
                    "Expected Traffic Density alertType ABOVE (button label '"
                            + ABOVE_CONDITION_LABEL
                            + "') but got: "
                            + settingsPage.getConditionButtonText(TRAFFIC_DENSITY_PLACEHOLDER));
        }
    }

    private void runPanelOpenCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        loginIfNeeded(configReader.getLoginEmail(), configReader.getLoginPassword());
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
        loginIfNeeded(configReader.getLoginEmail(), configReader.getLoginPassword());
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
        loginIfNeeded(configReader.getLoginEmail(), configReader.getLoginPassword());
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
        loginIfNeeded(configReader.getLoginEmail(), configReader.getLoginPassword());
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
        loginIfNeeded(configReader.getLoginEmail(), configReader.getLoginPassword());
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
        loginIfNeeded(configReader.getLoginEmail(), configReader.getLoginPassword());
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
        loginIfNeeded(configReader.getLoginEmail(), configReader.getLoginPassword());
        alertsPage.navigateToHome();
        alertsPage.clickNotificationsBell();
        alertsPage.waitForPanelVisible();
        Assert.assertTrue(
                alertsPage.getPanelAlertCardCount() >= 1,
                "[" + tcId + "] Expected at least one alert card in panel");
        if ("air-quality".equals(sensorType) && !alertsPage.hasPanelAlertForSensorType(sensorType)) {
            throw new SkipException("[" + tcId + "] No air-quality alert card in panel after seeding");
        }
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
        String section = data.get("section");
        ensureAlertsPresent(tcId, data);
        loginIfNeeded(configReader.getLoginEmail(), configReader.getLoginPassword());
        alertsPage.navigateToHome();
        alertsPage.clickNotificationsBell();
        alertsPage.waitForPanelVisible();
        Assert.assertTrue(
                alertsPage.getPanelAlertCardCount() >= 1,
                "[" + tcId + "] Expected at least one alert card to open modal");
        alertsPage.clickFirstPanelAlertCard();
        alertsPage.waitForSensorModalVisible(section);
        int before = alertsPage.getSensorModalAlertCardCount(section);
        Assert.assertTrue(before >= 1, "[" + tcId + "] Expected at least one alert in modal to delete");
        alertsPage.clickDeleteFirstAlertInModal(section);
        alertsPage.waitForSensorModalAlertCount(section, before - 1);
        Assert.assertEquals(
                alertsPage.getSensorModalAlertCardCount(section),
                before - 1,
                "[" + tcId + "] Card removed from modal list");
    }

    private void runPanelOnRouteCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        loginIfNeeded(configReader.getLoginEmail(), configReader.getLoginPassword());
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

    private void loginIfNeeded(String email, String password) throws Exception {
        if (configReader == null) {
            configReader = new ConfigReader();
        }
        String url = driver.getCurrentUrl();
        String loginPath = configReader.getLoginPath();
        boolean notAuthenticated = url == null
                || url.contains("data:")
                || url.contains(loginPath);
        if (notAuthenticated) {
            login(email, password);
        }
        authToken = alertsPage.getAuthTokenFromLocalStorage();
    }
}
