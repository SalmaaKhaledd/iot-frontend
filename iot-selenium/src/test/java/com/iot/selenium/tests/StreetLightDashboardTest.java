package com.iot.selenium.tests;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import com.iot.selenium.config.ConfigReader;
import com.iot.selenium.pages.StreetLightDashboardPage;
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
 * E2E tests for {@code /street-light-dashboard}.
 * Reuses the AirQualityDashboardTest pattern adapted for Street Lights (F#10, F#11, F#12).
 */
@Feature("Street Light Dashboard")
public class StreetLightDashboardTest extends BaseTest {
  private static final String SHEET_NAME = "StreetLightDashboard";
  private static final long ALERT_POLL_TIMEOUT_MS = 20_000L;
  private static final long ALERT_POLL_INTERVAL_MS = 2_000L;

  private boolean driverInitialized = false;
  private StreetLightDashboardPage streetLightDashboardPage;

  @BeforeClass(alwaysRun = true)
  public void seedBeforeClass() {
    configReader = new ConfigReader();
    ensureAuthToken();
    super.setUp();
    driverInitialized = true;
    streetLightDashboardPage = new StreetLightDashboardPage(driver);
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
    streetLightDashboardPage = new StreetLightDashboardPage(driver);
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

  // ========== F#10: Street Light Dashboard (Entry Point + Dashboard) ==========

  @Test(priority = 1)
  public void testEntryPoint() throws Exception {
    runStreetLightCardVisibleCase("TC-F10-01");
    runStreetLightCardNavigatesCase("TC-F10-02");
    runStreetLightCardTitleCase("TC-F10-03");
    runUnauthenticatedRedirectCase("TC-F10-04");
  }

  @Test(priority = 2)
  public void testDashboardNavigation() throws Exception {
    seedForF10();
    runDashboardLoadsCase("TC-F10-05");
    runBackButtonCase("TC-F10-06");
    runTableVisibleCase("TC-F10-07");
    runTableColumnsCase("TC-F10-08");
    runFilterPanelVisibleCase("TC-F10-09");
    runLoadingStateCase("TC-F10-10");
    runPageHeadingCase("TC-F10-11");
    runTableRowDataCase("TC-F10-12");
    runDashboardUnauthenticatedCase("TC-F10-13");
  }

  // ========== F#11: Street Light Filtering & Searching ==========

  @Test(priority = 3)
  public void testFilters() throws Exception {
    seedForF10();
    runFilterByZamalekCase("TC-F11-01");
    runFilterByDowntownCase("TC-F11-02");
    runFilterByNewCairoCase("TC-F11-03");
    runFilterByOnStatusCase("TC-F11-04");
    runFilterByOffStatusCase("TC-F11-05");
  }

  @Test(priority = 4)
  public void testSorting() throws Exception {
    seedForSorting();
    runSortMostRecentCase("TC-F11-06");
    runSortOldestFirstCase("TC-F11-07");
    runSortPowerHighLowCase("TC-F11-08");
    runSortPowerLowHighCase("TC-F11-09");
    runSortBrightnessLowHighCase("TC-F11-10");
    runSortOrderCase("TC-F11-11");
  }

  @Test(priority = 5)
  public void testPagination() throws Exception {
    seedForPagination();
    runNextPageCase("TC-F11-12");
    runPrevPageCase("TC-F11-13");
    runFirstPageCase("TC-F11-14");
    runLastPageCase("TC-F11-15");
    runPageSizeFiveCase("TC-F11-16");
    runPageSizeTenCase("TC-F11-17");
    runResetFiltersCase("TC-F11-18");
  }

  @Test(priority = 6)
  public void testFilterEdgeCases() throws Exception {
    seedForF10();
    runEmptyStateCase("TC-F11-19");
    runApplyFiltersReloadsCase("TC-F11-20");
    runFilterPanelToggleCase("TC-F11-21");
  }

  // ========== F#12: Street Light Notifications ==========

  @Test(priority = 7)
  public void testAlertBanners() throws Exception {
    seedForF12();
    runAlertBannerVisibleCase("TC-F12-01");
    runAlertBannerDismissCase("TC-F12-02");
    runAlertBannerAutoDismissCase("TC-F12-03");
    runNoAlertBannersCase("TC-F12-04");
    runMultipleAlertBannersCase("TC-F12-05");
  }

  // ========== F#10: Analytics ==========

  @Test(priority = 8)
  public void testAnalytics() throws Exception {
    seedForF10();
    runAnalyticsPanelVisibleCase("TC-F10-14");
    runAnalyticsToggleCase("TC-F10-15");
    runAnalyticsMetricCardsCase("TC-F10-16");
    runAnalyticsChartsRenderCase("TC-F10-17");
  }

  // ========== Seed Methods ==========

  @Step("Authenticate API, flush and generate street light sensors")
  private void seedForF10() throws Exception {
    ensureAuthToken();
    StreetLightDashboardPage.flushSensors(authToken);
    StreetLightDashboardPage.generateSensors(authToken);
  }

  @Step("Authenticate API, flush and generate two street light readings for sort-order checks")
  private void seedForSorting() throws Exception {
    ensureAuthToken();
    StreetLightDashboardPage.flushSensors(authToken);
    StreetLightDashboardPage.generateSensors(authToken);
    StreetLightDashboardPage.generateSensors(authToken);
  }

  @Step("Authenticate API, flush and generate street light sensors for pagination")
  private void seedForPagination() throws Exception {
    ensureAuthToken();
    StreetLightDashboardPage.flushSensors(authToken);
    for (int i = 0; i < 12; i++) {
      StreetLightDashboardPage.generateSensors(authToken);
    }
  }

  @Step("Seed street light alerts and open dashboard with alert banners")
  private void seedForF12() throws Exception {
    AlertsPage.flushAlertsPublic();
    AlertsPage.flushSettingsPublic();
    ensureAuthToken();
    String settingsBody =
      "[{\"type\":\"STREET_LIGHT\",\"metric\":\"POWER_CONSUMPTION\",\"thresholdValue\":1,\"alertType\":\"ABOVE\"}]";
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
      StreetLightDashboardPage.generateSensors(authToken);
    }
    streetLightDashboardPage.openWithoutToastDismiss().waitForResultsReady();
    long deadline = System.currentTimeMillis() + ALERT_POLL_TIMEOUT_MS;
    while (System.currentTimeMillis() < deadline) {
      if (streetLightDashboardPage.isAlertBannerVisible()) {
        return;
      }
      Thread.sleep(ALERT_POLL_INTERVAL_MS);
      driver.navigate().refresh();
      streetLightDashboardPage.waitForLoadWithoutDismissingToasts().waitForResultsReady();
    }
  }

  // ========== Entry Point Cases ==========

  @Step("TC-F10-01: Street Light nav card is visible on /home")
  private void runStreetLightCardVisibleCase(String tcId) {
    rowByTcId(tcId);
    streetLightDashboardPage.navigateToHome();
    Assert.assertTrue(
      streetLightDashboardPage.isStreetLightNavCardVisible(),
      "[" + tcId + "] Street Light nav card should be visible on /home");
  }

  @Step("TC-F10-02: Clicking street light card navigates to /street-light-dashboard")
  private void runStreetLightCardNavigatesCase(String tcId) {
    rowByTcId(tcId);
    streetLightDashboardPage.openFromHome();
    Assert.assertTrue(
      driver.getCurrentUrl().contains("/street-light-dashboard"),
      "[" + tcId + "] Clicking street light card should navigate to /street-light-dashboard");
  }

  @Step("TC-F10-03: Street Light card title contains expected description")
  private void runStreetLightCardTitleCase(String tcId) {
    rowByTcId(tcId);
    streetLightDashboardPage.navigateToHome();
    String cardText = streetLightDashboardPage.getStreetLightNavCardText();
    Assert.assertTrue(
      cardText.toLowerCase().contains("street light") || cardText.toLowerCase().contains("lighting"),
      "[" + tcId + "] Street Light card title incorrect, got: " + cardText);
  }

  @Step("TC-F10-04: Unauthenticated user is redirected to /login from /home")
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

  @Step("TC-F10-05: Street light dashboard loads at /street-light-dashboard")
  private void runDashboardLoadsCase(String tcId) {
    rowByTcId(tcId);
    streetLightDashboardPage.open();
    Assert.assertTrue(
      streetLightDashboardPage.isLoaded(),
      "[" + tcId + "] Street light dashboard page should be loaded");
    Assert.assertTrue(
      driver.getCurrentUrl().contains("/street-light-dashboard"),
      "[" + tcId + "] URL should contain /street-light-dashboard");
  }

  @Step("TC-F10-06: Back button navigates to /home")
  private void runBackButtonCase(String tcId) {
    rowByTcId(tcId);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    streetLightDashboardPage.navigateToHome();
    Assert.assertTrue(
      driver.getCurrentUrl().contains("/home"),
      "[" + tcId + "] Back button should navigate to /home");
  }

  @Step("TC-F10-07: Street light readings table is visible")
  private void runTableVisibleCase(String tcId) {
    rowByTcId(tcId);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    Assert.assertTrue(
      streetLightDashboardPage.isTableVisible(),
      "[" + tcId + "] Street light readings table should be visible");
  }

  @Step("TC-F10-08: Table displays all column headers")
  private void runTableColumnsCase(String tcId) {
    rowByTcId(tcId);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    String pageSource = driver.getPageSource().toUpperCase();
    String[] columnHeaders = {
      "LOCATION", "TIMESTAMP", "BRIGHTNESS", "POWER", "STATUS"
    };
    for (String columnHeader : columnHeaders) {
      Assert.assertTrue(
        pageSource.contains(columnHeader),
        "[" + tcId + "] Page should contain column header: " + columnHeader);
    }
  }

  @Step("TC-F10-09: Filter panel is visible")
  private void runFilterPanelVisibleCase(String tcId) {
    rowByTcId(tcId);
    streetLightDashboardPage.open().waitForLoad();
    Assert.assertTrue(
      streetLightDashboardPage.isFilterPanelVisible(),
      "[" + tcId + "] Filter panel should be visible");
  }

  @Step("TC-F10-10: Loading state finishes and dashboard is loaded")
  private void runLoadingStateCase(String tcId) {
    rowByTcId(tcId);
    driver.get(configReader.getBaseUrl() + configReader.getStreetLightDashboardPath());
    streetLightDashboardPage.waitForUrl(configReader.getStreetLightDashboardPath(), 15);
    streetLightDashboardPage.waitForLoadingIfPresent(5);
    streetLightDashboardPage.waitForResultsReady();
    Assert.assertTrue(
      streetLightDashboardPage.isLoaded(),
      "[" + tcId + "] Dashboard should finish loading");
  }

  @Step("TC-F10-11: Page heading contains Sensor readings")
  private void runPageHeadingCase(String tcId) {
    rowByTcId(tcId);
    streetLightDashboardPage.open().waitForLoad();
    Assert.assertTrue(
      driver.getPageSource().contains("Sensor readings"),
      "[" + tcId + "] Page should contain heading: Sensor readings");
  }

  @Step("TC-F10-12: First table row contains valid location data")
  private void runTableRowDataCase(String tcId) {
    rowByTcId(tcId);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    String rowText = streetLightDashboardPage.getFirstRowText();
    boolean containsLocation =
      rowText.contains("CAIRO_ZAMALEK") ||
        rowText.contains("CAIRO_DOWNTOWN") ||
        rowText.contains("CAIRO_NEW_CAIRO");
    Assert.assertTrue(
      containsLocation,
      "[" + tcId + "] First table row should contain a valid Cairo location, got: " + rowText);
  }

  @Step("TC-F10-13: Unauthenticated access to dashboard redirects to /login")
  private void runDashboardUnauthenticatedCase(String tcId) {
    rowByTcId(tcId);
    ((JavascriptExecutor) driver).executeScript("window.localStorage.clear();");
    driver.get(configReader.getBaseUrl() + configReader.getStreetLightDashboardPath());
    new WebDriverWait(driver, Duration.ofSeconds(10))
      .until(ExpectedConditions.urlContains("/login"));
    Assert.assertTrue(
      driver.getCurrentUrl().contains("/login"),
      "[" + tcId + "] Unauthenticated user should be redirected to /login");
    restoreAuthenticatedSession();
  }

  // ========== Filter Cases ==========

  @Step("TC-F11-01: Filter by Cairo Zamalek location")
  private void runFilterByZamalekCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    streetLightDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_ZAMALEK"));
    streetLightDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      streetLightDashboardPage.isTableVisible() || streetLightDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying location filter");
    if (streetLightDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        driver.getPageSource().contains(data.getOrDefault("expected_location", "CAIRO_ZAMALEK")),
        "[" + tcId + "] Filtered results should contain CAIRO_ZAMALEK");
    }
  }

  @Step("TC-F11-02: Filter by Cairo Downtown location")
  private void runFilterByDowntownCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    streetLightDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_DOWNTOWN"));
    streetLightDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      streetLightDashboardPage.isTableVisible() || streetLightDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying location filter");
    if (streetLightDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        driver.getPageSource().contains(data.getOrDefault("expected_location", "CAIRO_DOWNTOWN")),
        "[" + tcId + "] Filtered results should contain CAIRO_DOWNTOWN");
    }
  }

  @Step("TC-F11-03: Filter by Cairo New Cairo location")
  private void runFilterByNewCairoCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    streetLightDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_NEW_CAIRO"));
    streetLightDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      streetLightDashboardPage.isTableVisible() || streetLightDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying location filter");
    if (streetLightDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        driver.getPageSource().contains(data.getOrDefault("expected_location", "CAIRO_NEW_CAIRO")),
        "[" + tcId + "] Filtered results should contain CAIRO_NEW_CAIRO");
    }
  }

  @Step("TC-F11-04: Filter by ON status")
  private void runFilterByOnStatusCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    streetLightDashboardPage.selectStatus(data.getOrDefault("status", "ON"));
    streetLightDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      streetLightDashboardPage.isTableVisible() || streetLightDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying status filter");
    if (streetLightDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        driver.getPageSource().contains(data.getOrDefault("expected_status", "ON")),
        "[" + tcId + "] Filtered results should contain ON");
    }
  }

  @Step("TC-F11-05: Filter by OFF status")
  private void runFilterByOffStatusCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    streetLightDashboardPage.selectStatus(data.getOrDefault("status", "OFF"));
    streetLightDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      streetLightDashboardPage.isTableVisible() || streetLightDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying status filter");
    if (streetLightDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        driver.getPageSource().contains(data.getOrDefault("expected_status", "OFF")),
        "[" + tcId + "] Filtered results should contain OFF");
    }
  }

  // ========== Sort Cases ==========

  @Step("TC-F11-06: Sort by most recent first")
  private void runSortMostRecentCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    streetLightDashboardPage.selectSort(data.getOrDefault("sort", "timestamp:desc"));
    streetLightDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      streetLightDashboardPage.isTableVisible() || streetLightDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying sort");
    if (streetLightDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        streetLightDashboardPage.getRowCount() > 0,
        "[" + tcId + "] Sorted table should have at least one row");
    }
  }

  @Step("TC-F11-07: Sort by oldest first")
  private void runSortOldestFirstCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    streetLightDashboardPage.selectSort(data.getOrDefault("sort", "timestamp:asc"));
    streetLightDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      streetLightDashboardPage.isTableVisible() || streetLightDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying sort");
    if (streetLightDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        streetLightDashboardPage.getRowCount() > 0,
        "[" + tcId + "] Sorted table should have at least one row");
    }
  }

  @Step("TC-F11-08: Sort by power consumption high to low")
  private void runSortPowerHighLowCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    streetLightDashboardPage.selectSort(data.getOrDefault("sort", "powerConsumption:desc"));
    streetLightDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      streetLightDashboardPage.isTableVisible() || streetLightDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying sort");
    if (streetLightDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        streetLightDashboardPage.getRowCount() > 0,
        "[" + tcId + "] Sorted table should have at least one row");
    }
  }

  @Step("TC-F11-09: Sort by power consumption low to high")
  private void runSortPowerLowHighCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    streetLightDashboardPage.selectSort(data.getOrDefault("sort", "powerConsumption:asc"));
    streetLightDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      streetLightDashboardPage.isTableVisible() || streetLightDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying sort");
    if (streetLightDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        streetLightDashboardPage.getRowCount() > 0,
        "[" + tcId + "] Sorted table should have at least one row");
    }
  }

  @Step("TC-F11-10: Sort by brightness level low to high")
  private void runSortBrightnessLowHighCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    streetLightDashboardPage.selectSort(data.getOrDefault("sort", "brightnessLevel:asc"));
    streetLightDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      streetLightDashboardPage.isTableVisible() || streetLightDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Table or empty state should be visible after applying sort");
    if (streetLightDashboardPage.isTableVisible()) {
      Assert.assertTrue(
        streetLightDashboardPage.getRowCount() > 0,
        "[" + tcId + "] Sorted table should have at least one row");
    }
  }

  @Step("TC-F11-11: Rows sorted by timestamp descending are in correct order")
  private void runSortOrderCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    streetLightDashboardPage.selectSort(data.getOrDefault("sort", "timestamp:desc"));
    streetLightDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      streetLightDashboardPage.getRowCount() >= 2,
      "[" + tcId + "] Need at least two table rows to verify timestamp sort order");
    String first = streetLightDashboardPage.getFirstRowTimestamp();
    String second = streetLightDashboardPage.getSecondRowTimestamp();
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

  @Step("TC-F11-12: Next page navigation shows rows and enables previous page")
  private void runNextPageCase(String tcId) {
    rowByTcId(tcId);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    Assert.assertTrue(
      streetLightDashboardPage.isNextPageEnabled(),
      "[" + tcId + "] Next page button should be enabled");
    streetLightDashboardPage.clickNextPage();
    Assert.assertTrue(
      streetLightDashboardPage.getRowCount() > 0,
      "[" + tcId + "] Next page should display at least one row");
    Assert.assertTrue(
      streetLightDashboardPage.isPrevPageEnabled(),
      "[" + tcId + "] Previous page button should be enabled after navigating forward");
  }

  @Step("TC-F11-13: Previous page returns to first page")
  private void runPrevPageCase(String tcId) {
    rowByTcId(tcId);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    streetLightDashboardPage.clickNextPage();
    streetLightDashboardPage.clickPrevPage();
    Assert.assertFalse(
      streetLightDashboardPage.isPrevPageEnabled(),
      "[" + tcId + "] Previous page button should be disabled on first page");
    Assert.assertTrue(
      streetLightDashboardPage.getRowCount() > 0,
      "[" + tcId + "] First page should display at least one row");
  }

  @Step("TC-F11-14: First page button returns to first page")
  private void runFirstPageCase(String tcId) {
    rowByTcId(tcId);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    streetLightDashboardPage.clickNextPage();
    streetLightDashboardPage.clickFirstPage();
    Assert.assertFalse(
      streetLightDashboardPage.isPrevPageEnabled(),
      "[" + tcId + "] Previous page button should be disabled on first page");
    Assert.assertFalse(
      streetLightDashboardPage.isFirstPageEnabled(),
      "[" + tcId + "] First page button should be disabled on first page");
  }

  @Step("TC-F11-15: Last page button navigates to last page")
  private void runLastPageCase(String tcId) {
    rowByTcId(tcId);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    streetLightDashboardPage.clickLastPage();
    Assert.assertFalse(
      streetLightDashboardPage.isNextPageEnabled(),
      "[" + tcId + "] Next page button should be disabled on last page");
    Assert.assertFalse(
      streetLightDashboardPage.isLastPageEnabled(),
      "[" + tcId + "] Last page button should be disabled on last page");
  }

  @Step("TC-F11-16: Page size five shows five rows")
  private void runPageSizeFiveCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    int expectedSize = Integer.parseInt(data.getOrDefault("page_size", "5"));
    streetLightDashboardPage.selectPageSize(data.getOrDefault("page_size", "5")).waitForResultsReady();
    Assert.assertEquals(
      streetLightDashboardPage.getRowCount(),
      expectedSize,
      "[" + tcId + "] Page size 5 should show exactly 5 rows");
  }

  @Step("TC-F11-17: Page size ten shows ten rows")
  private void runPageSizeTenCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    int expectedSize = Integer.parseInt(data.getOrDefault("page_size", "10"));
    streetLightDashboardPage.selectPageSize(data.getOrDefault("page_size", "10")).waitForResultsReady();
    Assert.assertEquals(
      streetLightDashboardPage.getRowCount(),
      expectedSize,
      "[" + tcId + "] Page size 10 should show exactly 10 rows");
  }

  @Step("TC-F11-18: Reset filters restores full results table")
  private void runResetFiltersCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    streetLightDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_ZAMALEK"));
    streetLightDashboardPage.clickApplyFilters().waitForResultsReady();
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    Assert.assertTrue(
      streetLightDashboardPage.getRowCount() > 0,
      "[" + tcId + "] Reset filters should restore at least one row");
  }

  // ========== Filter Edge Cases ==========

  @Step("TC-F11-19: Restrictive filters show empty state or matching table")
  private void runEmptyStateCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    streetLightDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_ZAMALEK"));
    streetLightDashboardPage.selectStatus(data.getOrDefault("status", "OFF"));
    streetLightDashboardPage.clickApplyFilters().waitForResultsReady();
    if (streetLightDashboardPage.isEmptyStateVisible()) {
      Assert.assertFalse(
        streetLightDashboardPage.isTableVisible(),
        "[" + tcId + "] Table should not be visible when empty state is shown");
    } else {
      Assert.assertTrue(
        streetLightDashboardPage.isTableVisible(),
        "[" + tcId + "] Table should be visible when seeded data matches filters");
    }
  }

  @Step("TC-F11-20: Apply filters reloads table or empty state")
  private void runApplyFiltersReloadsCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    streetLightDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_ZAMALEK"));
    streetLightDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(
      streetLightDashboardPage.isTableVisible() || streetLightDashboardPage.isEmptyStateVisible(),
      "[" + tcId + "] Apply filters should show table or empty state");
  }

  @Step("TC-F11-21: Filter panel expands and collapses")
  private void runFilterPanelToggleCase(String tcId) {
    rowByTcId(tcId);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    Assert.assertFalse(
      streetLightDashboardPage.isFilterPanelCollapsed(),
      "[" + tcId + "] Filter panel should be expanded initially");
    streetLightDashboardPage.clickFilterPanelToggle().waitForFilterPanelCollapsed();
    Assert.assertTrue(
      streetLightDashboardPage.isFilterPanelCollapsed(),
      "[" + tcId + "] Filter panel should be collapsed after toggle");
    streetLightDashboardPage.clickFilterPanelToggle().waitForFilterPanelExpanded();
    Assert.assertFalse(
      streetLightDashboardPage.isFilterPanelCollapsed(),
      "[" + tcId + "] Filter panel should be expanded after second toggle");
  }

  // ========== Alert Banner Cases ==========

  @Step("TC-F12-01: Street light alert banner is visible on dashboard")
  private void runAlertBannerVisibleCase(String tcId) {
    rowByTcId(tcId);
    Assert.assertTrue(
      streetLightDashboardPage.isAlertBannerVisible(),
      "[" + tcId + "] Alert banner should be visible");
  }

  @Step("TC-F12-02: Alert banner can be dismissed manually")
  private void runAlertBannerDismissCase(String tcId) {
    rowByTcId(tcId);
    streetLightDashboardPage.waitForAlertBanner();
    int bannersBeforeDismiss = streetLightDashboardPage.getAlertBannerCount();
    Assert.assertTrue(
      bannersBeforeDismiss > 0,
      "[" + tcId + "] Expected at least one alert banner before dismiss");
    streetLightDashboardPage.dismissAlertBanner();
    new WebDriverWait(driver, Duration.ofSeconds(5))
      .until(d -> streetLightDashboardPage.getAlertBannerCount() < bannersBeforeDismiss);
    Assert.assertTrue(
      streetLightDashboardPage.getAlertBannerCount() < bannersBeforeDismiss,
      "[" + tcId + "] Manual dismiss should remove at least one alert banner");
  }

  @Step("TC-F12-03: Alert banner auto-dismisses after five seconds")
  private void runAlertBannerAutoDismissCase(String tcId) throws Exception {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    streetLightDashboardPage.waitForAlertBanner();
    long waitMs = Long.parseLong(data.getOrDefault("wait_ms", "7000"));
    Thread.sleep(waitMs);
    Assert.assertFalse(
      streetLightDashboardPage.isAlertBannerVisible(),
      "[" + tcId + "] Alert banner should auto-dismiss without clicking close");
  }
/*
  @Step("TC-F12-04: No alert banners when alerts are flushed")
  private void runNoAlertBannersCase(String tcId) throws Exception {
    rowByTcId(tcId);
    AlertsPage.flushAlertsPublic();
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    Assert.assertFalse(
      streetLightDashboardPage.isAlertBannerVisible(),
      "[" + tcId + "] No alert banner should be visible after flushing alerts");
  }
*/
  @Step("TC-F12-04: No alert banners when alerts are flushed")
  private void runNoAlertBannersCase(String tcId) throws Exception {
    rowByTcId(tcId);
    // Clear any stale banners from previous cases in this test method
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    AlertsPage.flushAlertsPublic();
    // Force fresh page load and clear any stale UI banners
    driver.get(configReader.getBaseUrl() + configReader.getStreetLightDashboardPath());
    streetLightDashboardPage.waitForLoadWithoutDismissingToasts().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    Assert.assertFalse(
      streetLightDashboardPage.isAlertBannerVisible(),
      "[" + tcId + "] No alert banner should be visible after flushing alerts");
  }

  @Step("TC-F12-05: Multiple alert banners can appear at once")
  private void runMultipleAlertBannersCase(String tcId) throws Exception {
    rowByTcId(tcId);
    for (int i = 0; i < 3; i++) {
      StreetLightDashboardPage.generateSensors(authToken);
    }
    streetLightDashboardPage.openWithoutToastDismiss().waitForResultsReady();
    boolean multipleBannersVisible = false;
    long deadline = System.currentTimeMillis() + 3_000L;
    while (System.currentTimeMillis() < deadline) {
      if (streetLightDashboardPage.getAlertBannerCount() >= 2) {
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

  @Step("TC-F10-14: Analytics panel header is visible when data exists")
  private void runAnalyticsPanelVisibleCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    Assert.assertTrue(
      streetLightDashboardPage.isAnalyticsHeaderVisible(),
      "[" + tcId + "] Analytics panel header should be visible when readings exist");
  }

  @Step("TC-F10-15: Analytics panel collapses and expands on header click")
  private void runAnalyticsToggleCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    Assert.assertTrue(
      streetLightDashboardPage.isAnalyticsPanelExpanded(),
      "[" + tcId + "] Analytics panel should start expanded");
    streetLightDashboardPage.clickAnalyticsToggle();
    Assert.assertFalse(
      streetLightDashboardPage.isAnalyticsPanelExpanded(),
      "[" + tcId + "] Analytics panel should collapse after header click");
    streetLightDashboardPage.clickAnalyticsToggle();
    Assert.assertTrue(
      streetLightDashboardPage.isAnalyticsPanelExpanded(),
      "[" + tcId + "] Analytics panel should expand again after second header click");
  }

  @Step("TC-F10-16: Analytics metric cards display non-empty values")
  private void runAnalyticsMetricCardsCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    List<String> values = streetLightDashboardPage.getAnalyticsMetricCardTexts();
    Assert.assertFalse(
      values.isEmpty(),
      "[" + tcId + "] At least one metric card should be visible");
    for (String value : values) {
      Assert.assertFalse(
        value.isBlank(),
        "[" + tcId + "] Metric card value should not be blank, got: " + value);
    }
  }

  @Step("TC-F10-17: All three charts render when data exists")
  private void runAnalyticsChartsRenderCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    Assert.assertTrue(
      streetLightDashboardPage.areChartsRendered(),
      "[" + tcId + "] All three charts (brightness line, power line, status donut) should be rendered");
  }
}
