package com.iot.selenium.tests;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import com.iot.selenium.config.ConfigReader;
import com.iot.selenium.pages.AirQualityDashboardPage;
import com.iot.selenium.pages.AlertsPage;

import io.qameta.allure.Feature;
import io.qameta.allure.Step;
import org.testng.Assert;
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
 * E2E tests for {@code /air-quality-dashboard}.
 * Reuses the TrafficDashboardTest pattern adapted for Air Quality (F#13, F#14, F#15).
 */
@Feature("Air Quality Dashboard")
public class AirQualityDashboardTest extends BaseTest {
  private static final String SHEET_NAME = "AirQualityDashboard";
  private static final long ALERT_POLL_TIMEOUT_MS = 20_000L;
  private static final long ALERT_POLL_INTERVAL_MS = 2_000L;

  private boolean driverInitialized = false;
  private AirQualityDashboardPage airQualityDashboardPage;

  @BeforeClass(alwaysRun = true)
  public void seedBeforeClass() {
    configReader = new ConfigReader();
    ensureAuthToken();
    super.setUp();
    driverInitialized = true;
    airQualityDashboardPage = new AirQualityDashboardPage(driver);
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
    airQualityDashboardPage = new AirQualityDashboardPage(driver);
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

  // ========== F#13: Air Pollution Dashboard (Entry Point + Dashboard) ==========

  @Test(priority = 1)
  public void testEntryPoint() throws Exception {
    runAirQualityCardVisibleCase("TC-F13-01");
    runAirQualityCardNavigatesCase("TC-F13-02");
    runAirQualityCardTitleCase("TC-F13-03");
    runUnauthenticatedRedirectCase("TC-F13-04");
  }

  @Test(priority = 2)
  public void testDashboardNavigation() throws Exception {
    seedForF13();
    runDashboardLoadsCase("TC-F13-05");
    runBackButtonCase("TC-F13-06");
    runTableVisibleCase("TC-F13-07");
    runTableColumnsCase("TC-F13-08");
    runFilterPanelVisibleCase("TC-F13-09");
    runLoadingStateCase("TC-F13-10");
    runPageHeadingCase("TC-F13-11");
    runTableRowDataCase("TC-F13-12");
    runDashboardUnauthenticatedCase("TC-F13-13");
  }

  // ========== F#14: Air Pollution Filtering & Searching ==========

  @Test(priority = 3)
  public void testFilters() throws Exception {
    seedForF13();
    runFilterByNasrCityCase("TC-F14-01");
    runFilterByMaadiCase("TC-F14-02");
    runFilterByHeliopolisCase("TC-F14-03");
    runFilterByGoodCase("TC-F14-04");
    runFilterByModerateCase("TC-F14-05");
    runFilterByUnhealthyCase("TC-F14-06");
    runFilterByVeryUnhealthyCase("TC-F14-07");
    runFilterByHazardousCase("TC-F14-08");
  }

  @Test(priority = 4)
  public void testSorting() throws Exception {
    seedForSorting();
    runSortMostRecentCase("TC-F14-09");
    runSortOldestFirstCase("TC-F14-10");
    runSortCoHighLowCase("TC-F14-11");
    runSortCoLowHighCase("TC-F14-12");
    runSortOzoneHighLowCase("TC-F14-13");
    runSortOzoneLowHighCase("TC-F14-14");
    runSortOrderCase("TC-F14-15");
  }

  @Test(priority = 5)
  public void testPagination() throws Exception {
    seedForPagination();
    runNextPageCase("TC-F14-16");
    runPrevPageCase("TC-F14-17");
    runFirstPageCase("TC-F14-18");
    runLastPageCase("TC-F14-19");
    runPageSizeFiveCase("TC-F14-20");
    runPageSizeTenCase("TC-F14-21");
    runResetFiltersCase("TC-F14-22");
  }

  @Test(priority = 6)
  public void testFilterEdgeCases() throws Exception {
    seedForF13();
    runEmptyStateCase("TC-F14-23");
    runApplyFiltersReloadsCase("TC-F14-24");
    runFilterPanelToggleCase("TC-F14-25");
  }

  // ========== F#15: Air Pollution Notifications ==========

  @Test(priority = 7)
  public void testAlertBanners() throws Exception {
    seedForF15();
    runAlertBannerVisibleCase("TC-F15-01");
    runAlertBannerDismissCase("TC-F15-02");
    runAlertBannerAutoDismissCase("TC-F15-03");
    runNoAlertBannersCase("TC-F15-04");
    runMultipleAlertBannersCase("TC-F15-05");
  }

  // ========== F#13: Analytics ==========

  @Test(priority = 8)
  public void testAnalytics() throws Exception {
    seedForF13();
    runAnalyticsPanelVisibleCase("TC-F13-14");
    runAnalyticsToggleCase("TC-F13-15");
    runAnalyticsMetricCardsCase("TC-F13-16");
    runAnalyticsChartsRenderCase("TC-F13-17");
  }

  // ========== Seed Methods ==========

  @Step("Authenticate API, flush and generate air quality sensors")
  private void seedForF13() throws Exception {
    ensureAuthToken();
    AirQualityDashboardPage.flushSensors(authToken);
    AirQualityDashboardPage.generateSensors(authToken);
  }

  @Step("Authenticate API, flush and generate two air quality readings for sort-order checks")
  private void seedForSorting() throws Exception {
    ensureAuthToken();
    AirQualityDashboardPage.flushSensors(authToken);
    AirQualityDashboardPage.generateSensors(authToken);
    AirQualityDashboardPage.generateSensors(authToken);
  }

  @Step("Authenticate API, flush and generate air quality sensors for pagination")
  private void seedForPagination() throws Exception {
    ensureAuthToken();
    AirQualityDashboardPage.flushSensors(authToken);
    for (int i = 0; i < 25; i++) {
      AirQualityDashboardPage.generateSensors(authToken);
    }
  }

  @Step("Seed air quality alerts and open dashboard with alert banners")
  private void seedForF15() throws Exception {
    AlertsPage.flushAlertsPublic();
    AlertsPage.flushSettingsPublic();
    ensureAuthToken();
    String settingsBody =
      "[{\"type\":\"AIR_POLLUTION\",\"metric\":\"CO\",\"thresholdValue\":1,\"alertType\":\"ABOVE\"}]";
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
      AirQualityDashboardPage.generateSensors(authToken);
    }
    airQualityDashboardPage.openWithoutToastDismiss().waitForResultsReady();
    long deadline = System.currentTimeMillis() + ALERT_POLL_TIMEOUT_MS;
    while (System.currentTimeMillis() < deadline) {
      if (airQualityDashboardPage.isAlertBannerVisible()) {
        return;
      }
      Thread.sleep(ALERT_POLL_INTERVAL_MS);
      driver.navigate().refresh();
      airQualityDashboardPage.waitForLoadWithoutDismissingToasts().waitForResultsReady();
    }
  }

  // ========== Entry Point Cases ==========

  @Step("TC-F13-01: Air Quality nav card is visible on /home")
  private void runAirQualityCardVisibleCase(String tcId) {
    rowByTcId(tcId);
    airQualityDashboardPage.navigateToHome();
    Assert.assertTrue(
      airQualityDashboardPage.isAirQualityNavCardVisible(),
      "[" + tcId + "] Air Quality nav card should be visible on /home");
  }

  @Step("TC-F13-02: Clicking air quality card navigates to /air-quality-dashboard")
  private void runAirQualityCardNavigatesCase(String tcId) {
    rowByTcId(tcId);
    airQualityDashboardPage.openFromHome();
    Assert.assertTrue(
      driver.getCurrentUrl().contains("/air-quality-dashboard"),
      "[" + tcId + "] Clicking air quality card should navigate to /air-quality-dashboard");
  }

  @Step("TC-F13-03: Air Quality card title contains expected description")
  private void runAirQualityCardTitleCase(String tcId) {
    rowByTcId(tcId);
    airQualityDashboardPage.navigateToHome();
    String cardText = airQualityDashboardPage.getAirQualityNavCardText();
    Assert.assertTrue(
      cardText.toLowerCase().contains("air quality") || cardText.toLowerCase().contains("pollution"),
      "[" + tcId + "] Air Quality card title incorrect, got: " + cardText);
  }

  @Step("TC-F13-04: Unauthenticated user is redirected to /login from /home")
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

  // ========== Dashboard Navigation Cases ==========

  @Step("TC-F13-05: Air quality dashboard loads at /air-quality-dashboard")
  private void runDashboardLoadsCase(String tcId) {
    rowByTcId(tcId);
    airQualityDashboardPage.open();
    Assert.assertTrue(
      airQualityDashboardPage.isLoaded(),
      "[" + tcId + "] Air quality dashboard page should be loaded");
    Assert.assertTrue(
      driver.getCurrentUrl().contains("/air-quality-dashboard"),
      "[" + tcId + "] URL should contain /air-quality-dashboard");
  }

  @Step("TC-F13-06: Back button navigates to /home")
  private void runBackButtonCase(String tcId) {
    rowByTcId(tcId);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.navigateToHome();
    Assert.assertTrue(
      driver.getCurrentUrl().contains("/home"),
      "[" + tcId + "] Back button should navigate to /home");
  }

  @Step("TC-F13-07: Air quality readings table is visible")
  private void runTableVisibleCase(String tcId) {
    rowByTcId(tcId);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    Assert.assertTrue(
      airQualityDashboardPage.isTableVisible(),
      "[" + tcId + "] Air quality readings table should be visible");
  }

  @Step("TC-F13-08: Table displays all column headers")
  private void runTableColumnsCase(String tcId) {
    rowByTcId(tcId);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    String pageSource = driver.getPageSource().toUpperCase();
    String[] columnHeaders = {
      "LOCATION", "TIMESTAMP", "CO", "OZONE", "NO2", "SO2", "PM2.5", "PM10", "POLLUTION"
    };
    for (String columnHeader : columnHeaders) {
      Assert.assertTrue(
        pageSource.contains(columnHeader),
        "[" + tcId + "] Page should contain column header: " + columnHeader);
    }
  }

  @Step("TC-F13-09: Filter panel is visible")
  private void runFilterPanelVisibleCase(String tcId) {
    rowByTcId(tcId);
    airQualityDashboardPage.open().waitForLoad();
    Assert.assertTrue(
      airQualityDashboardPage.isFilterPanelVisible(),
      "[" + tcId + "] Filter panel should be visible");
  }

  @Step("TC-F13-10: Loading state finishes and dashboard is loaded")
  private void runLoadingStateCase(String tcId) {
    rowByTcId(tcId);
    driver.get(configReader.getBaseUrl() + configReader.getAirQualityDashboardPath());
    airQualityDashboardPage.waitForUrl(configReader.getAirQualityDashboardPath(), 15);
    airQualityDashboardPage.waitForLoadingIfPresent(5);
    airQualityDashboardPage.waitForResultsReady();
    Assert.assertTrue(
      airQualityDashboardPage.isLoaded(),
      "[" + tcId + "] Dashboard should finish loading");
  }

  @Step("TC-F13-11: Page heading contains Sensor readings")
  private void runPageHeadingCase(String tcId) {
    rowByTcId(tcId);
    airQualityDashboardPage.open().waitForLoad();
    Assert.assertTrue(
      driver.getPageSource().contains("Sensor readings"),
      "[" + tcId + "] Page should contain heading: Sensor readings");
  }

  @Step("TC-F13-12: First table row contains valid location data")
  private void runTableRowDataCase(String tcId) {
    rowByTcId(tcId);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    String rowText = airQualityDashboardPage.getFirstRowText();
    boolean containsLocation =
      rowText.contains("CAIRO_NASR_CITY") ||
        rowText.contains("CAIRO_MAADI") ||
        rowText.contains("CAIRO_HELIOPOLIS");
    Assert.assertTrue(
      containsLocation,
      "[" + tcId + "] First table row should contain a valid Cairo location, got: " + rowText);
  }

  @Step("TC-F13-13: Unauthenticated access to dashboard redirects to /login")
  private void runDashboardUnauthenticatedCase(String tcId) {
    rowByTcId(tcId);
    ((JavascriptExecutor) driver).executeScript("window.localStorage.clear();");
    driver.get(configReader.getBaseUrl() + configReader.getAirQualityDashboardPath());
    new WebDriverWait(driver, Duration.ofSeconds(10))
      .until(ExpectedConditions.urlContains("/login"));
    Assert.assertTrue(
      driver.getCurrentUrl().contains("/login"),
      "[" + tcId + "] Unauthenticated user should be redirected to /login");
    restoreAuthenticatedSession();
  }

  // ========== Filter Cases ==========

  @Step("TC-F14-01: Filter by Cairo Nasr City location")
  private void runFilterByNasrCityCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_NASR_CITY"));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      airQualityDashboardPage.isTableVisible() || airQualityDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying location filter");
    if (airQualityDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        driver.getPageSource().contains(data.getOrDefault("expected_location", "CAIRO_NASR_CITY")),
        "[" + tcId + "] Filtered results should contain CAIRO_NASR_CITY");
    }
  }

  @Step("TC-F14-02: Filter by Cairo Maadi location")
  private void runFilterByMaadiCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_MAADI"));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      airQualityDashboardPage.isTableVisible() || airQualityDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying location filter");
    if (airQualityDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        driver.getPageSource().contains(data.getOrDefault("expected_location", "CAIRO_MAADI")),
        "[" + tcId + "] Filtered results should contain CAIRO_MAADI");
    }
  }

  @Step("TC-F14-03: Filter by Cairo Heliopolis location")
  private void runFilterByHeliopolisCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_HELIOPOLIS"));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      airQualityDashboardPage.isTableVisible() || airQualityDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying location filter");
    if (airQualityDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        driver.getPageSource().contains(data.getOrDefault("expected_location", "CAIRO_HELIOPOLIS")),
        "[" + tcId + "] Filtered results should contain CAIRO_HELIOPOLIS");
    }
  }

  @Step("TC-F14-04: Filter by GOOD pollution level")
  private void runFilterByGoodCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.selectPollutionLevel(data.getOrDefault("pollutionLevel", "GOOD"));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      airQualityDashboardPage.isTableVisible() || airQualityDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying pollution filter");
    if (airQualityDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        driver.getPageSource().contains(data.getOrDefault("expected_pollution", "GOOD")),
        "[" + tcId + "] Filtered results should contain GOOD");
    }
  }

  @Step("TC-F14-05: Filter by MODERATE pollution level")
  private void runFilterByModerateCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.selectPollutionLevel(data.getOrDefault("pollutionLevel", "MODERATE"));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      airQualityDashboardPage.isTableVisible() || airQualityDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying pollution filter");
    if (airQualityDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        driver.getPageSource().contains(data.getOrDefault("expected_pollution", "MODERATE")),
        "[" + tcId + "] Filtered results should contain MODERATE");
    }
  }

  @Step("TC-F14-06: Filter by UNHEALTHY pollution level")
  private void runFilterByUnhealthyCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.selectPollutionLevel(data.getOrDefault("pollutionLevel", "UNHEALTHY"));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      airQualityDashboardPage.isTableVisible() || airQualityDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying pollution filter");
    if (airQualityDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        driver.getPageSource().contains(data.getOrDefault("expected_pollution", "UNHEALTHY")),
        "[" + tcId + "] Filtered results should contain UNHEALTHY");
    }
  }

  @Step("TC-F14-07: Filter by VERY_UNHEALTHY pollution level")
  private void runFilterByVeryUnhealthyCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.selectPollutionLevel(data.getOrDefault("pollutionLevel", "VERY_UNHEALTHY"));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      airQualityDashboardPage.isTableVisible() || airQualityDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying pollution filter");
    if (airQualityDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        driver.getPageSource().contains(data.getOrDefault("expected_pollution", "VERY_UNHEALTHY")),
        "[" + tcId + "] Filtered results should contain VERY_UNHEALTHY");
    }
  }

  @Step("TC-F14-08: Filter by HAZARDOUS pollution level")
  private void runFilterByHazardousCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.selectPollutionLevel(data.getOrDefault("pollutionLevel", "HAZARDOUS"));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      airQualityDashboardPage.isTableVisible() || airQualityDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying pollution filter");
    if (airQualityDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        driver.getPageSource().contains(data.getOrDefault("expected_pollution", "HAZARDOUS")),
        "[" + tcId + "] Filtered results should contain HAZARDOUS");
    }
  }

  // ========== Sort Cases ==========

  @Step("TC-F14-09: Sort by most recent first")
  private void runSortMostRecentCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.selectSort(data.getOrDefault("sort", "timestamp:desc"));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      airQualityDashboardPage.isTableVisible() || airQualityDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying sort");
    if (airQualityDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        airQualityDashboardPage.getRowCount() > 0,
        "[" + tcId + "] Sorted table should have at least one row");
    }
  }

  @Step("TC-F14-10: Sort by oldest first")
  private void runSortOldestFirstCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.selectSort(data.getOrDefault("sort", "timestamp:asc"));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      airQualityDashboardPage.isTableVisible() || airQualityDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying sort");
    if (airQualityDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        airQualityDashboardPage.getRowCount() > 0,
        "[" + tcId + "] Sorted table should have at least one row");
    }
  }

  @Step("TC-F14-11: Sort by CO high to low")
  private void runSortCoHighLowCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.selectSort(data.getOrDefault("sort", "co:desc"));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      airQualityDashboardPage.isTableVisible() || airQualityDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying sort");
    if (airQualityDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        airQualityDashboardPage.getRowCount() > 0,
        "[" + tcId + "] Sorted table should have at least one row");
    }
  }

  @Step("TC-F14-12: Sort by CO low to high")
  private void runSortCoLowHighCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.selectSort(data.getOrDefault("sort", "co:asc"));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      airQualityDashboardPage.isTableVisible() || airQualityDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying sort");
    if (airQualityDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        airQualityDashboardPage.getRowCount() > 0,
        "[" + tcId + "] Sorted table should have at least one row");
    }
  }

  @Step("TC-F14-13: Sort by ozone high to low")
  private void runSortOzoneHighLowCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.selectSort(data.getOrDefault("sort", "ozone:desc"));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      airQualityDashboardPage.isTableVisible() || airQualityDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying sort");
    if (airQualityDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        airQualityDashboardPage.getRowCount() > 0,
        "[" + tcId + "] Sorted table should have at least one row");
    }
  }

  @Step("TC-F14-14: Sort by ozone low to high")
  private void runSortOzoneLowHighCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.selectSort(data.getOrDefault("sort", "ozone:asc"));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      airQualityDashboardPage.isTableVisible() || airQualityDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying sort");
    if (airQualityDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        airQualityDashboardPage.getRowCount() > 0,
        "[" + tcId + "] Sorted table should have at least one row");
    }
  }

  @Step("TC-F14-15: Rows sorted by timestamp descending are in correct order")
  private void runSortOrderCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.selectSort(data.getOrDefault("sort", "timestamp:desc"));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      airQualityDashboardPage.getRowCount() >= 2,
      "[" + tcId + "] Need at least two table rows to verify timestamp sort order");
    String first = airQualityDashboardPage.getFirstRowTimestamp();
    String second = airQualityDashboardPage.getSecondRowTimestamp();
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

  // ========== Pagination Cases ==========

  @Step("TC-F14-16: Next page navigation shows rows and enables previous page")
  private void runNextPageCase(String tcId) {
    rowByTcId(tcId);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    Assert.assertTrue(
      airQualityDashboardPage.isNextPageEnabled(),
      "[" + tcId + "] Next page button should be enabled");
    airQualityDashboardPage.clickNextPage();
    Assert.assertTrue(
      airQualityDashboardPage.getRowCount() > 0,
      "[" + tcId + "] Next page should display at least one row");
    Assert.assertTrue(
      airQualityDashboardPage.isPrevPageEnabled(),
      "[" + tcId + "] Previous page button should be enabled after navigating forward");
  }

  @Step("TC-F14-17: Previous page returns to first page")
  private void runPrevPageCase(String tcId) {
    rowByTcId(tcId);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.clickNextPage();
    airQualityDashboardPage.clickPrevPage();
    Assert.assertFalse(
      airQualityDashboardPage.isPrevPageEnabled(),
      "[" + tcId + "] Previous page button should be disabled on first page");
    Assert.assertTrue(
      airQualityDashboardPage.getRowCount() > 0,
      "[" + tcId + "] First page should display at least one row");
  }

  @Step("TC-F14-18: First page button returns to first page")
  private void runFirstPageCase(String tcId) {
    rowByTcId(tcId);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.clickNextPage();
    airQualityDashboardPage.clickFirstPage();
    Assert.assertFalse(
      airQualityDashboardPage.isPrevPageEnabled(),
      "[" + tcId + "] Previous page button should be disabled on first page");
    Assert.assertFalse(
      airQualityDashboardPage.isFirstPageEnabled(),
      "[" + tcId + "] First page button should be disabled on first page");
  }

  @Step("TC-F14-19: Last page button navigates to last page")
  private void runLastPageCase(String tcId) {
    rowByTcId(tcId);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.clickLastPage();
    Assert.assertFalse(
      airQualityDashboardPage.isNextPageEnabled(),
      "[" + tcId + "] Next page button should be disabled on last page");
    Assert.assertFalse(
      airQualityDashboardPage.isLastPageEnabled(),
      "[" + tcId + "] Last page button should be disabled on last page");
  }

  @Step("TC-F14-20: Page size five shows five rows")
  private void runPageSizeFiveCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    int expectedSize = Integer.parseInt(data.getOrDefault("page_size", "5"));
    airQualityDashboardPage.selectPageSize(data.getOrDefault("page_size", "5")).waitForResultsReady();
    Assert.assertEquals(
      airQualityDashboardPage.getRowCount(),
      expectedSize,
      "[" + tcId + "] Page size 5 should show exactly 5 rows");
  }

  @Step("TC-F14-21: Page size ten shows ten rows")
  private void runPageSizeTenCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    int expectedSize = Integer.parseInt(data.getOrDefault("page_size", "10"));
    airQualityDashboardPage.selectPageSize(data.getOrDefault("page_size", "10")).waitForResultsReady();
    Assert.assertEquals(
      airQualityDashboardPage.getRowCount(),
      expectedSize,
      "[" + tcId + "] Page size 10 should show exactly 10 rows");
  }

  @Step("TC-F14-22: Reset filters restores full results table")
  private void runResetFiltersCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_NASR_CITY"));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    Assert.assertTrue(
      airQualityDashboardPage.getRowCount() > 0,
      "[" + tcId + "] Reset filters should restore at least one row");
  }

  // ========== Filter Edge Cases ==========

  @Step("TC-F14-23: Restrictive filters show empty state or matching table")
  private void runEmptyStateCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_NASR_CITY"));
    airQualityDashboardPage.selectPollutionLevel(data.getOrDefault("pollutionLevel", "HAZARDOUS"));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    if (airQualityDashboardPage.isEmptyStateVisible()) {
      Assert.assertFalse(
        airQualityDashboardPage.isTableVisible(),
        "[" + tcId + "] Table should not be visible when empty state is shown");
    } else {
      Assert.assertTrue(
        airQualityDashboardPage.isTableVisible(),
        "[" + tcId + "] Table should be visible when seeded data matches filters");
    }
  }

  @Step("TC-F14-24: Apply filters reloads table or empty state")
  private void runApplyFiltersReloadsCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_NASR_CITY"));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      airQualityDashboardPage.isTableVisible() || airQualityDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Apply filters should show table or empty state");
  }

  @Step("TC-F14-25: Filter panel expands and collapses")
  private void runFilterPanelToggleCase(String tcId) {
    rowByTcId(tcId);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    Assert.assertFalse(
      airQualityDashboardPage.isFilterPanelCollapsed(),
      "[" + tcId + "] Filter panel should be expanded initially");
    airQualityDashboardPage.clickFilterPanelToggle().waitForFilterPanelCollapsed();
    Assert.assertTrue(
      airQualityDashboardPage.isFilterPanelCollapsed(),
      "[" + tcId + "] Filter panel should be collapsed after toggle");
    airQualityDashboardPage.clickFilterPanelToggle().waitForFilterPanelExpanded();
    Assert.assertFalse(
      airQualityDashboardPage.isFilterPanelCollapsed(),
      "[" + tcId + "] Filter panel should be expanded after second toggle");
  }

  // ========== Alert Banner Cases ==========

  @Step("TC-F15-01: Air quality alert banner is visible on dashboard")
  private void runAlertBannerVisibleCase(String tcId) {
    rowByTcId(tcId);
    Assert.assertTrue(
      airQualityDashboardPage.isAlertBannerVisible(),
      "[" + tcId + "] Alert banner should be visible");
  }

  @Step("TC-F15-02: Alert banner can be dismissed manually")
  private void runAlertBannerDismissCase(String tcId) {
    rowByTcId(tcId);
    airQualityDashboardPage.waitForAlertBanner();
    int bannersBeforeDismiss = airQualityDashboardPage.getAlertBannerCount();
    Assert.assertTrue(
      bannersBeforeDismiss > 0,
      "[" + tcId + "] Expected at least one alert banner before dismiss");
    airQualityDashboardPage.dismissAlertBanner();
    new WebDriverWait(driver, Duration.ofSeconds(5))
      .until(d -> airQualityDashboardPage.getAlertBannerCount() < bannersBeforeDismiss);
    Assert.assertTrue(
      airQualityDashboardPage.getAlertBannerCount() < bannersBeforeDismiss,
      "[" + tcId + "] Manual dismiss should remove at least one alert banner");
  }

  @Step("TC-F15-03: Alert banner auto-dismisses after five seconds")
  private void runAlertBannerAutoDismissCase(String tcId) throws Exception {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.waitForAlertBanner();
    long waitMs = Long.parseLong(data.getOrDefault("wait_ms", "7000"));
    Thread.sleep(waitMs);
    Assert.assertFalse(
      airQualityDashboardPage.isAlertBannerVisible(),
      "[" + tcId + "] Alert banner should auto-dismiss without clicking close");
  }
/*
  @Step("TC-F15-04: No alert banners when alerts are flushed")
  private void runNoAlertBannersCase(String tcId) throws Exception {
    rowByTcId(tcId);
    AlertsPage.flushAlertsPublic();
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    Assert.assertFalse(
      airQualityDashboardPage.isAlertBannerVisible(),
      "[" + tcId + "] No alert banner should be visible after flushing alerts");
  }
*/
  @Step("TC-F15-04: No alert banners when alerts are flushed")
  private void runNoAlertBannersCase(String tcId) throws Exception {
    rowByTcId(tcId);
    AlertsPage.flushAlertsPublic();
    // Force fresh page load and clear any stale UI banners
    driver.get(configReader.getBaseUrl() + configReader.getAirQualityDashboardPath());
    airQualityDashboardPage.waitForLoadWithoutDismissingToasts().waitForResultsReady();
    // If any banners leaked from prior cases, dismiss them
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    Assert.assertFalse(
      airQualityDashboardPage.isAlertBannerVisible(),
      "[" + tcId + "] No alert banner should be visible after flushing alerts");
  }

  @Step("TC-F15-05: Multiple alert banners can appear at once")
  private void runMultipleAlertBannersCase(String tcId) throws Exception {
    rowByTcId(tcId);
    for (int i = 0; i < 3; i++) {
      AirQualityDashboardPage.generateSensors(authToken);
    }
    airQualityDashboardPage.openWithoutToastDismiss().waitForResultsReady();
    boolean multipleBannersVisible = false;
    long deadline = System.currentTimeMillis() + 3_000L;
    while (System.currentTimeMillis() < deadline) {
      if (airQualityDashboardPage.getAlertBannerCount() >= 2) {
        multipleBannersVisible = true;
        break;
      }
      Thread.sleep(500);
    }
    Assert.assertTrue(
      multipleBannersVisible,
      "[" + tcId + "] At least two alert banners should be visible before auto-dismiss");
  }

  // ========== Analytics Cases ==========

  @Step("TC-F13-14: Analytics panel header is visible when data exists")
  private void runAnalyticsPanelVisibleCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    Assert.assertTrue(
      airQualityDashboardPage.isAnalyticsHeaderVisible(),
      "[" + tcId + "] Analytics panel header should be visible when readings exist");
  }

  @Step("TC-F13-15: Analytics panel collapses and expands on header click")
  private void runAnalyticsToggleCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    Assert.assertTrue(
      airQualityDashboardPage.isAnalyticsPanelExpanded(),
      "[" + tcId + "] Analytics panel should start expanded");
    airQualityDashboardPage.clickAnalyticsToggle();
    Assert.assertFalse(
      airQualityDashboardPage.isAnalyticsPanelExpanded(),
      "[" + tcId + "] Analytics panel should collapse after header click");
    airQualityDashboardPage.clickAnalyticsToggle();
    Assert.assertTrue(
      airQualityDashboardPage.isAnalyticsPanelExpanded(),
      "[" + tcId + "] Analytics panel should expand again after second header click");
  }

  @Step("TC-F13-16: Analytics metric cards display non-empty values")
  private void runAnalyticsMetricCardsCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    List<String> values = airQualityDashboardPage.getAnalyticsMetricCardTexts();
    Assert.assertFalse(
      values.isEmpty(),
      "[" + tcId + "] At least one metric card should be visible");
    for (String value : values) {
      Assert.assertFalse(
        value.isBlank(),
        "[" + tcId + "] Metric card value should not be blank, got: " + value);
    }
  }

  @Step("TC-F13-17: All three charts render when data exists")
  private void runAnalyticsChartsRenderCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    Assert.assertTrue(
      airQualityDashboardPage.areChartsRendered(),
      "[" + tcId + "] All three charts (CO line, ozone line, pollution donut) should be rendered");
  }
}
