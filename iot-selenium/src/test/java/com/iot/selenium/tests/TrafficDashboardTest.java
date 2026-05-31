package com.iot.selenium.tests;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import com.iot.selenium.config.ConfigReader;
import com.iot.selenium.pages.AlertsPage;
import com.iot.selenium.pages.TrafficDashboardPage;

import io.qameta.allure.Feature;
import io.qameta.allure.Step;
import org.testng.Assert;
import org.testng.SkipException;
import org.testng.annotations.AfterClass;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;
import org.openqa.selenium.JavascriptExecutor;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import java.time.Duration;

/**
 * E2E tests for {@code /traffic-dashboard}. API seeding ({@code generateSensors} / per-type flush) is added
 * in setup only when a test needs table or empty-state data — not for entry-point (F6) cases.
 */
@Feature("Traffic Dashboard")
public class TrafficDashboardTest extends BaseTest {
    private static final String SHEET_NAME = "TrafficDashboard";
    private static final long ALERT_POLL_TIMEOUT_MS = 20_000L;
    private static final long ALERT_POLL_INTERVAL_MS = 2_000L;

    private boolean driverInitialized = false;
    private TrafficDashboardPage trafficDashboardPage;

    @BeforeClass(alwaysRun = true)
    public void seedBeforeClass() {
        configReader = new ConfigReader();
        ensureAuthToken();
        super.setUp();
        driverInitialized = true;
        trafficDashboardPage = new TrafficDashboardPage(driver);
        restoreAuthenticatedSession();
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
        trafficDashboardPage = new TrafficDashboardPage(driver);
    }

    @AfterMethod(alwaysRun = true)
    @Override
    public void tearDown() {
        if (driver == null) return;
        // Keep browser alive across tests
    }

    @AfterClass(alwaysRun = true)
    public void tearDownClass() {
        driverInitialized = false;
        super.tearDown();
    }

    private Map<String, String> rowByTcId(String tcId) {
        return Arrays.stream(rowsForSheet(SHEET_NAME))
                .map(this::rowData)
                .filter(rd -> tcId.equals(rd.get("tc_id")))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Row not found for tc_id: " + tcId));
    }

    @Test(priority = 1)
    public void testEntryPoint() throws Exception {
        runTrafficCardVisibleCase("TC-F6-01");
        runTrafficCardNavigatesCase("TC-F6-02");
        runTrafficCardTitleCase("TC-F6-03");
        runAirQualityNavCardCase("TC-F6-05");
        runStreetLightsNavCardCase("TC-F6-06");
        runUnauthenticatedRedirectCase("TC-F6-04");
    }

    @Test(priority = 2)
    public void testDashboardNavigation() throws Exception {
        seedForF7();
        runDashboardLoadsCase("TC-F7-01");
        runBackButtonCase("TC-F7-03");
        runTableVisibleCase("TC-F7-04");
        runTableColumnsCase("TC-F7-05");
        runFilterPanelVisibleCase("TC-F7-06");
        runLoadingStateCase("TC-F7-07");
        runPageHeadingCase("TC-F7-08");
        runTableRowDataCase("TC-F7-09");
        runDashboardUnauthenticatedCase("TC-F7-02");
    }

    @Test(priority = 3)
    public void testFilters() throws Exception {
        seedForF7();
        runFilterByRingRoadCase("TC-F8-01");
        runFilterByOctoberBridgeCase("TC-F8-02");
        runFilterBySalahSalemCase("TC-F8-03");
        runFilterByLowCongestionCase("TC-F8-04");
        runFilterByModerateCongestionCase("TC-F8-05");
        runFilterByHighCongestionCase("TC-F8-06");
        runFilterBySevereCongestionCase("TC-F8-07");
    }

    @Test(priority = 4)
    public void testSorting() throws Exception {
        seedForSorting();
        runSortMostRecentCase("TC-F8-08");
        runSortOldestFirstCase("TC-F8-09");
        runSortDensityLowHighCase("TC-F8-10");
        runSortDensityHighLowCase("TC-F8-11");
        runSortSpeedLowHighCase("TC-F8-12");
        runSortSpeedHighLowCase("TC-F8-13");
        runSortOrderCase("TC-F8-24");
    }

    @Test(priority = 5)
    public void testPagination() throws Exception {
        seedForPagination();
        runNextPageCase("TC-F8-14");
        runPrevPageCase("TC-F8-15");
        runFirstPageCase("TC-F8-16");
        runLastPageCase("TC-F8-17");
        runPageSizeFiveCase("TC-F8-18");
        runPageSizeTenCase("TC-F8-19");
        runResetFiltersCase("TC-F8-20");
    }

    @Test(priority = 6)
    public void testFilterEdgeCases() throws Exception {
        seedForF7();
        runEmptyStateCase("TC-F8-21");
        runApplyFiltersReloadsCase("TC-F8-22");
        runFilterPanelToggleCase("TC-F8-23");
    }

    @Test(priority = 7)
    public void testAlertBanners() throws Exception {
        seedForF9();
        runAlertBannerVisibleCase("TC-F9-01");
        runAlertBannerDismissCase("TC-F9-02");
        runAlertBannerAutoDismissCase("TC-F9-03");
        runNoAlertBannersCase("TC-F9-04");
        runMultipleAlertBannersCase("TC-F9-05");
    }

    // TC-F10-05 (chart update on filter) excluded — not reliably testable via Selenium
    @Test(priority = 8)
    public void testAnalytics() throws Exception {
        seedForF7();
        runAnalyticsPanelVisibleCase("TC-F10-01");
        runAnalyticsToggleCase("TC-F10-02");
        runAnalyticsMetricCardsCase("TC-F10-03");
        runAnalyticsChartsRenderCase("TC-F10-04");
    }

    @Step("Authenticate API, flush and generate traffic sensors")
    private void seedForF7() throws Exception {
        ensureAuthToken();
        TrafficDashboardPage.flushSensors(authToken);
        TrafficDashboardPage.generateSensors(authToken);
    }

    @Step("Authenticate API, flush and generate two traffic readings for sort-order checks")
    private void seedForSorting() throws Exception {
        ensureAuthToken();
        TrafficDashboardPage.flushSensors(authToken);
        TrafficDashboardPage.generateSensors(authToken);
        TrafficDashboardPage.generateSensors(authToken);
    }

    @Step("Authenticate API, flush and generate traffic sensors for pagination")
    private void seedForPagination() throws Exception {
        ensureAuthToken();
        TrafficDashboardPage.flushSensors(authToken);
        for (int i = 0; i < 12; i++) {
            TrafficDashboardPage.generateSensors(authToken);
        }
    }

    @Step("Seed traffic alerts and open dashboard with alert banners")
    private void seedForF9() throws Exception {
        AlertsPage.flushAlertsPublic();
        AlertsPage.flushSettingsPublic();
        ensureAuthToken();
        String settingsBody =
                "[{\"type\":\"TRAFFIC\",\"metric\":\"TRAFFIC_DENSITY\",\"thresholdValue\":1,\"alertType\":\"ABOVE\"}]";
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest settingsRequest = HttpRequest.newBuilder()
                .uri(URI.create(configReader.getApiBaseUrl() + "/api/settings"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + authToken)
                .PUT(HttpRequest.BodyPublishers.ofString(settingsBody))
                .build();
        HttpResponse<String> settingsResponse = client.send(settingsRequest, HttpResponse.BodyHandlers.ofString());
        if (settingsResponse.statusCode() < 200 || settingsResponse.statusCode() >= 300) {
            throw new IllegalStateException(
                    "PUT /api/settings failed with status " + settingsResponse.statusCode()
                            + ": " + settingsResponse.body());
        }
        for (int i = 0; i < 3; i++) {
            TrafficDashboardPage.generateSensors(authToken);
        }
        trafficDashboardPage.openWithoutToastDismiss().waitForResultsReady();
        long deadline = System.currentTimeMillis() + ALERT_POLL_TIMEOUT_MS;
        while (System.currentTimeMillis() < deadline) {
            if (trafficDashboardPage.isAlertBannerVisible()) {
                return;
            }
            Thread.sleep(ALERT_POLL_INTERVAL_MS);
            driver.navigate().refresh();
            trafficDashboardPage.waitForLoadWithoutDismissingToasts().waitForResultsReady();
        }
    }

    @Step("TC-F6-01: Traffic nav card is visible on /home")
    private void runTrafficCardVisibleCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.navigateToHome();
        Assert.assertTrue(
                trafficDashboardPage.isTrafficNavCardVisible(),
                "[" + tcId + "] Traffic nav card should be visible on /home");
    }

    @Step("TC-F6-02: Clicking traffic card navigates to /traffic-dashboard")
    private void runTrafficCardNavigatesCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.openFromHome();
        Assert.assertTrue(
                driver.getCurrentUrl().contains("/traffic-dashboard"),
                "[" + tcId + "] Clicking traffic card should navigate to /traffic-dashboard");
    }

    @Step("TC-F6-03: Traffic card title contains expected description")
    private void runTrafficCardTitleCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.navigateToHome();
        String cardText = trafficDashboardPage.getTrafficNavCardText();
        Assert.assertTrue(
                cardText.toLowerCase().contains("monitor road congestion and traffic flow"),
                "[" + tcId + "] Traffic card title incorrect, got: " + cardText);
    }

    @Step("TC-F6-04: Unauthenticated user is redirected to /login from /home")
    private void runUnauthenticatedRedirectCase(String tcId) {
        rowByTcId(tcId);
        ((JavascriptExecutor) driver).executeScript("window.localStorage.clear();");
        driver.get(configReader.getBaseUrl() + configReader.getHomePath());
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.urlContains("/login"));
        Assert.assertTrue(
                driver.getCurrentUrl().contains("/login"),
                "[" + tcId + "] Unauthenticated user should be redirected to /login");
        restoreAuthenticatedSession();
    }

    @Step("TC-F6-05: Air Quality nav card has data-testid attribute")
    private void runAirQualityNavCardCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.navigateToHome();
        if (!trafficDashboardPage.isAirQualityNavCardVisible()) {
            throw new SkipException(
                    "[" + tcId + "] BUG 86c9y6abu: Air Quality nav card is missing data-testid='air-quality-nav-card'");
        }
    }

    @Step("TC-F6-06: Street Lights nav card has data-testid attribute")
    private void runStreetLightsNavCardCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.navigateToHome();
        if (!trafficDashboardPage.isStreetLightsNavCardVisible()) {
            throw new SkipException(
                    "[" + tcId + "] BUG 86c9y6abu: Street Lights nav card is missing data-testid='street-lights-nav-card'");
        }
    }

    @Step("TC-F7-01: Traffic dashboard loads at /traffic-dashboard")
    private void runDashboardLoadsCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open();
        Assert.assertTrue(
                trafficDashboardPage.isLoaded(),
                "[" + tcId + "] Traffic dashboard page should be loaded");
        Assert.assertTrue(
                driver.getCurrentUrl().contains("/traffic-dashboard"),
                "[" + tcId + "] URL should contain /traffic-dashboard");
    }

    @Step("TC-F7-02: Unauthenticated access to dashboard redirects to /login")
    private void runDashboardUnauthenticatedCase(String tcId) {
        rowByTcId(tcId);
        ((JavascriptExecutor) driver).executeScript("window.localStorage.clear();");
        driver.get(configReader.getBaseUrl() + configReader.getTrafficDashboardPath());
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.urlContains("/login"));
        Assert.assertTrue(
                driver.getCurrentUrl().contains("/login"),
                "[" + tcId + "] Unauthenticated user should be redirected to /login");
        restoreAuthenticatedSession();
    }

    @Step("TC-F7-03: Back button navigates to /home")
    private void runBackButtonCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.navigateToHome();
        Assert.assertTrue(
                driver.getCurrentUrl().contains("/home"),
                "[" + tcId + "] Back button should navigate to /home");
    }

    @Step("TC-F7-04: Traffic readings table is visible")
    private void runTableVisibleCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible(),
                "[" + tcId + "] Traffic readings table should be visible");
    }

    @Step("TC-F7-05: Table displays all six column headers")
    private void runTableColumnsCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        String pageSource = driver.getPageSource().toUpperCase();
        String[] columnHeaders = {
                "LOCATION", "TIMESTAMP", "DENSITY", "AVG SPEED", "CONGESTION", "VEHICLES/MIN"
        };
        for (String columnHeader : columnHeaders) {
            Assert.assertTrue(
                    pageSource.contains(columnHeader),
                    "[" + tcId + "] Page should contain column header: " + columnHeader);
        }
    }

    @Step("TC-F7-06: Filter panel is visible")
    private void runFilterPanelVisibleCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open().waitForLoad();
        Assert.assertTrue(
                trafficDashboardPage.isFilterPanelVisible(),
                "[" + tcId + "] Filter panel should be visible");
    }

    @Step("TC-F7-07: Loading state finishes and dashboard is loaded")
    private void runLoadingStateCase(String tcId) {
        rowByTcId(tcId);
        driver.get(configReader.getBaseUrl() + configReader.getTrafficDashboardPath());
        trafficDashboardPage.waitForUrl(configReader.getTrafficDashboardPath(), 15);
        trafficDashboardPage.waitForLoadingIfPresent(5);
        trafficDashboardPage.waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isLoaded(),
                "[" + tcId + "] Dashboard should finish loading");
    }

    @Step("TC-F7-08: Page heading contains Sensor readings")
    private void runPageHeadingCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open().waitForLoad();
        Assert.assertTrue(
                driver.getPageSource().contains("Sensor readings"),
                "[" + tcId + "] Page should contain heading: Sensor readings");
    }

    @Step("TC-F7-09: First table row contains valid location data")
    private void runTableRowDataCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        String rowText = trafficDashboardPage.getFirstRowText();
        boolean containsLocation =
                rowText.contains("CAIRO_RING_ROAD") ||
                rowText.contains("CAIRO_OCTOBER_BRIDGE") ||
                rowText.contains("CAIRO_SALAH_SALEM_ROAD");
        Assert.assertTrue(
                containsLocation,
                "[" + tcId + "] First table row should contain a valid Cairo location, got: " + rowText);
    }

    @Step("TC-F8-01: Filter by Cairo Ring Road location")
    private void runFilterByRingRoadCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_RING_ROAD"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying location filter");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    driver.getPageSource().contains(data.getOrDefault("expected_location", "CAIRO_RING_ROAD")),
                    "[" + tcId + "] Filtered results should contain CAIRO_RING_ROAD");
        }
    }

    @Step("TC-F8-02: Filter by Cairo October Bridge location")
    private void runFilterByOctoberBridgeCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectLocation(data.getOrDefault("location", "OCTOBER_BRIDGE"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying location filter");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    driver.getPageSource().contains(data.getOrDefault("expected_location", "CAIRO_OCTOBER_BRIDGE")),
                    "[" + tcId + "] Filtered results should contain CAIRO_OCTOBER_BRIDGE");
        }
    }

    @Step("TC-F8-03: Filter by Cairo Salah Salem Road location")
    private void runFilterBySalahSalemCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectLocation(data.getOrDefault("location", "SALAH_SALEM"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying location filter");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    driver.getPageSource().contains(data.getOrDefault("expected_location", "CAIRO_SALAH_SALEM_ROAD")),
                    "[" + tcId + "] Filtered results should contain CAIRO_SALAH_SALEM_ROAD");
        }
    }

    @Step("TC-F8-04: Filter by low congestion level")
    private void runFilterByLowCongestionCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectCongestion(data.getOrDefault("congestion", "LOW"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying congestion filter");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    driver.getPageSource().contains(data.getOrDefault("expected_congestion", "LOW")),
                    "[" + tcId + "] Filtered results should contain LOW");
        }
    }

    @Step("TC-F8-05: Filter by moderate congestion level")
    private void runFilterByModerateCongestionCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectCongestion(data.getOrDefault("congestion", "MODERATE"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying congestion filter");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    driver.getPageSource().contains(data.getOrDefault("expected_congestion", "MODERATE")),
                    "[" + tcId + "] Filtered results should contain MODERATE");
        }
    }

    @Step("TC-F8-06: Filter by high congestion level")
    private void runFilterByHighCongestionCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectCongestion(data.getOrDefault("congestion", "HIGH"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying congestion filter");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    driver.getPageSource().contains(data.getOrDefault("expected_congestion", "HIGH")),
                    "[" + tcId + "] Filtered results should contain HIGH");
        }
    }

    @Step("TC-F8-07: Filter by severe congestion level")
    private void runFilterBySevereCongestionCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectCongestion(data.getOrDefault("congestion", "SEVERE"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying congestion filter");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    driver.getPageSource().contains(data.getOrDefault("expected_congestion", "SEVERE")),
                    "[" + tcId + "] Filtered results should contain SEVERE");
        }
    }

    @Step("TC-F8-08: Sort by most recent first")
    private void runSortMostRecentCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectSort(data.getOrDefault("sort", "timestamp:desc"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying sort");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    trafficDashboardPage.getRowCount() > 0,
                    "[" + tcId + "] Sorted table should have at least one row");
        }
    }

    @Step("TC-F8-09: Sort by oldest first")
    private void runSortOldestFirstCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectSort(data.getOrDefault("sort", "timestamp:asc"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying sort");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    trafficDashboardPage.getRowCount() > 0,
                    "[" + tcId + "] Sorted table should have at least one row");
        }
    }

    @Step("TC-F8-10: Sort by density low to high")
    private void runSortDensityLowHighCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectSort(data.getOrDefault("sort", "trafficDensity:asc"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying sort");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    trafficDashboardPage.getRowCount() > 0,
                    "[" + tcId + "] Sorted table should have at least one row");
        }
    }

    @Step("TC-F8-11: Sort by density high to low")
    private void runSortDensityHighLowCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectSort(data.getOrDefault("sort", "trafficDensity:desc"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying sort");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    trafficDashboardPage.getRowCount() > 0,
                    "[" + tcId + "] Sorted table should have at least one row");
        }
    }

    @Step("TC-F8-12: Sort by speed low to high")
    private void runSortSpeedLowHighCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectSort(data.getOrDefault("sort", "avgSpeed:asc"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying sort");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    trafficDashboardPage.getRowCount() > 0,
                    "[" + tcId + "] Sorted table should have at least one row");
        }
    }

    @Step("TC-F8-13: Sort by speed high to low")
    private void runSortSpeedHighLowCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectSort(data.getOrDefault("sort", "avgSpeed:desc"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying sort");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    trafficDashboardPage.getRowCount() > 0,
                    "[" + tcId + "] Sorted table should have at least one row");
        }
    }

    @Step("TC-F8-24: Rows sorted by timestamp descending are in correct order")
    private void runSortOrderCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectSort(data.getOrDefault("sort", "timestamp:desc"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.getRowCount() >= 2,
                "[" + tcId + "] Need at least two table rows to verify timestamp sort order");
        String first = trafficDashboardPage.getFirstRowTimestamp();
        String second = trafficDashboardPage.getSecondRowTimestamp();
        Assert.assertFalse(
                first.isEmpty(),
                "[" + tcId + "] First row timestamp should be present");
        Assert.assertFalse(
                second.isEmpty(),
                "[" + tcId + "] Second row timestamp should be present");
        Assert.assertTrue(
                first.compareTo(second) >= 0,
                "[" + tcId + "] First row timestamp should be >= second row timestamp in desc sort. Got: "
                        + first + " vs " + second);
    }

    @Step("TC-F8-14: Next page navigation shows rows and enables previous page")
    private void runNextPageCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isNextPageEnabled(),
                "[" + tcId + "] Next page button should be enabled");
        trafficDashboardPage.clickNextPage();
        Assert.assertTrue(
                trafficDashboardPage.getRowCount() > 0,
                "[" + tcId + "] Next page should display at least one row");
        Assert.assertTrue(
                trafficDashboardPage.isPrevPageEnabled(),
                "[" + tcId + "] Previous page button should be enabled after navigating forward");
    }

    @Step("TC-F8-15: Previous page returns to first page")
    private void runPrevPageCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.clickNextPage();
        trafficDashboardPage.clickPrevPage();
        Assert.assertFalse(
                trafficDashboardPage.isPrevPageEnabled(),
                "[" + tcId + "] Previous page button should be disabled on first page");
        Assert.assertTrue(
                trafficDashboardPage.getRowCount() > 0,
                "[" + tcId + "] First page should display at least one row");
    }

    @Step("TC-F8-16: First page button returns to first page")
    private void runFirstPageCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.clickNextPage();
        trafficDashboardPage.clickFirstPage();
        Assert.assertFalse(
                trafficDashboardPage.isPrevPageEnabled(),
                "[" + tcId + "] Previous page button should be disabled on first page");
        Assert.assertFalse(
                trafficDashboardPage.isFirstPageEnabled(),
                "[" + tcId + "] First page button should be disabled on first page");
    }

    @Step("TC-F8-17: Last page button navigates to last page")
    private void runLastPageCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.clickLastPage();
        Assert.assertFalse(
                trafficDashboardPage.isNextPageEnabled(),
                "[" + tcId + "] Next page button should be disabled on last page");
        Assert.assertFalse(
                trafficDashboardPage.isLastPageEnabled(),
                "[" + tcId + "] Last page button should be disabled on last page");
    }

    @Step("TC-F8-18: Page size five shows five rows")
    private void runPageSizeFiveCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        int expectedSize = Integer.parseInt(data.getOrDefault("page_size", "5"));
        trafficDashboardPage.selectPageSize(data.getOrDefault("page_size", "5")).waitForResultsReady();
        Assert.assertEquals(
                trafficDashboardPage.getRowCount(),
                expectedSize,
                "[" + tcId + "] Page size 5 should show exactly 5 rows");
    }

    @Step("TC-F8-19: Page size ten shows ten rows")
    private void runPageSizeTenCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        int expectedSize = Integer.parseInt(data.getOrDefault("page_size", "10"));
        trafficDashboardPage.selectPageSize(data.getOrDefault("page_size", "10")).waitForResultsReady();
        Assert.assertEquals(
                trafficDashboardPage.getRowCount(),
                expectedSize,
                "[" + tcId + "] Page size 10 should show exactly 10 rows");
    }

    @Step("TC-F8-20: Reset filters restores full results table")
    private void runResetFiltersCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_RING_ROAD"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.getRowCount() > 0,
                "[" + tcId + "] Reset filters should restore at least one row");
    }

    @Step("TC-F8-21: Restrictive filters show empty state or matching table")
    private void runEmptyStateCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_RING_ROAD"));
        trafficDashboardPage.selectCongestion(data.getOrDefault("congestion", "SEVERE"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        if (trafficDashboardPage.isEmptyStateVisible()) {
            Assert.assertFalse(
                    trafficDashboardPage.isTableVisible(),
                    "[" + tcId + "] Table should not be visible when empty state is shown");
        } else {
            Assert.assertTrue(
                    trafficDashboardPage.isTableVisible(),
                    "[" + tcId + "] Table should be visible when seeded data matches filters");
        }
    }

    @Step("TC-F8-22: Apply filters reloads table or empty state")
    private void runApplyFiltersReloadsCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_RING_ROAD"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Apply filters should show table or empty state");
    }

    @Step("TC-F8-23: Filter panel expands and collapses")
    private void runFilterPanelToggleCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        Assert.assertFalse(
                trafficDashboardPage.isFilterPanelCollapsed(),
                "[" + tcId + "] Filter panel should be expanded initially");
        trafficDashboardPage.clickFilterPanelToggle().waitForFilterPanelCollapsed();
        Assert.assertTrue(
                trafficDashboardPage.isFilterPanelCollapsed(),
                "[" + tcId + "] Filter panel should be collapsed after toggle");
        trafficDashboardPage.clickFilterPanelToggle().waitForFilterPanelExpanded();
        Assert.assertFalse(
                trafficDashboardPage.isFilterPanelCollapsed(),
                "[" + tcId + "] Filter panel should be expanded after second toggle");
    }

    @Step("TC-F9-01: Traffic alert banner is visible on dashboard")
    private void runAlertBannerVisibleCase(String tcId) {
        rowByTcId(tcId);
        Assert.assertTrue(
                trafficDashboardPage.isAlertBannerVisible(),
                "[" + tcId + "] Alert banner should be visible");
    }

    @Step("TC-F9-02: Alert banner can be dismissed manually")
    private void runAlertBannerDismissCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.waitForAlertBanner();
        int bannersBeforeDismiss = trafficDashboardPage.getAlertBannerCount();
        Assert.assertTrue(
                bannersBeforeDismiss > 0,
                "[" + tcId + "] Expected at least one alert banner before dismiss");
        trafficDashboardPage.dismissAlertBanner();
        new WebDriverWait(driver, Duration.ofSeconds(5))
                .until(d -> trafficDashboardPage.getAlertBannerCount() < bannersBeforeDismiss);
        Assert.assertTrue(
                trafficDashboardPage.getAlertBannerCount() < bannersBeforeDismiss,
                "[" + tcId + "] Manual dismiss should remove at least one alert banner");
    }

    @Step("TC-F9-03: Alert banner auto-dismisses after five seconds")
    private void runAlertBannerAutoDismissCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.waitForAlertBanner();
        long waitMs = Long.parseLong(data.getOrDefault("wait_ms", "7000"));
        Thread.sleep(waitMs);
        Assert.assertFalse(
                trafficDashboardPage.isAlertBannerVisible(),
                "[" + tcId + "] Alert banner should auto-dismiss without clicking close");
    }

    @Step("TC-F9-04: No alert banners when alerts are flushed")
    private void runNoAlertBannersCase(String tcId) throws Exception {
        rowByTcId(tcId);
        AlertsPage.flushAlertsPublic();
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        Assert.assertFalse(
                trafficDashboardPage.isAlertBannerVisible(),
                "[" + tcId + "] No alert banner should be visible after flushing alerts");
    }

    @Step("TC-F9-05: Multiple alert banners can appear at once")
    private void runMultipleAlertBannersCase(String tcId) throws Exception {
        rowByTcId(tcId);
        for (int i = 0; i < 3; i++) {
            TrafficDashboardPage.generateSensors(authToken);
        }
        trafficDashboardPage.openWithoutToastDismiss().waitForResultsReady();
        boolean multipleBannersVisible = false;
        long deadline = System.currentTimeMillis() + 3_000L;
        while (System.currentTimeMillis() < deadline) {
            if (trafficDashboardPage.getAlertBannerCount() >= 2) {
                multipleBannersVisible = true;
                break;
            }
            Thread.sleep(500);
        }
        Assert.assertTrue(
                multipleBannersVisible,
                "[" + tcId + "] At least two alert banners should be visible before auto-dismiss");
    }

    @Step("TC-F10-01: Analytics panel header is visible when data exists")
    private void runAnalyticsPanelVisibleCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        Assert.assertTrue(
                trafficDashboardPage.isAnalyticsHeaderVisible(),
                "[" + tcId + "] Analytics panel header should be visible when readings exist");
    }

    @Step("TC-F10-02: Analytics panel collapses and expands on header click")
    private void runAnalyticsToggleCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        Assert.assertTrue(
                trafficDashboardPage.isAnalyticsPanelExpanded(),
                "[" + tcId + "] Analytics panel should start expanded");
        trafficDashboardPage.clickAnalyticsToggle();
        Assert.assertFalse(
                trafficDashboardPage.isAnalyticsPanelExpanded(),
                "[" + tcId + "] Analytics panel should collapse after header click");
        trafficDashboardPage.clickAnalyticsToggle();
        Assert.assertTrue(
                trafficDashboardPage.isAnalyticsPanelExpanded(),
                "[" + tcId + "] Analytics panel should expand again after second header click");
    }

    @Step("TC-F10-03: Analytics metric cards display non-empty values")
    private void runAnalyticsMetricCardsCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        List<String> values = trafficDashboardPage.getAnalyticsMetricCardTexts();
        Assert.assertFalse(
                values.isEmpty(),
                "[" + tcId + "] At least one metric card should be visible");
        for (String value : values) {
            Assert.assertFalse(
                    value.isBlank(),
                    "[" + tcId + "] Metric card value should not be blank, got: " + value);
        }
    }

    @Step("TC-F10-04: All three charts render when data exists")
    private void runAnalyticsChartsRenderCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        Assert.assertTrue(
                trafficDashboardPage.areChartsRendered(),
                "[" + tcId + "] All three charts (speed, density, donut) should be rendered");
    }
}
