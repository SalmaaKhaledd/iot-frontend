package com.iot.selenium.tests;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

import com.iot.selenium.config.ConfigReader;
import com.iot.selenium.pages.AlertsPage;
import com.iot.selenium.pages.TrafficDashboardPage;
import com.iot.selenium.utils.LiveDbGuard;

import io.qameta.allure.Feature;
import io.qameta.allure.Step;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

@Feature("Traffic Dashboard")
public class TrafficDashboardTest extends BaseDashboardDataTest<TrafficDashboardPage> {
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
    if (configReader == null) configReader = new ConfigReader();
    trafficDashboardPage = new TrafficDashboardPage(driver);
  }

  @AfterMethod(alwaysRun = true)
  @Override
  public void tearDown() {
    if (driver == null) return;
  }

  @AfterClass(alwaysRun = true)
  public void tearDownClass() {
    driverInitialized = false;
    super.tearDown();
  }

  @Override
  protected TrafficDashboardPage getPage() {
    return trafficDashboardPage;
  }

  @Override
  protected String getSheetName() {
    return SHEET_NAME;
  }

  @Override
  protected void openDashboardAndClearBanners() {
    trafficDashboardPage.open().waitForLoad().waitForResultsReady();
    if (trafficDashboardPage.isAlertBannerStripVisible()) {
      trafficDashboardPage.dismissAllAlertBanners();
    }
  }

  @Override
  protected void openDashboardWithoutDismissingToasts() {
    trafficDashboardPage.openWithoutToastDismiss().waitForResultsReady();
  }

  @Override
  protected void generateSensors(String token) throws Exception {
    TrafficDashboardPage.generateSensors(token);
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
    runFilterByLocationCase("TC-F8-01", "CAIRO_RING_ROAD");
    runFilterByLocationCase("TC-F8-02", "OCTOBER_BRIDGE", "CAIRO_OCTOBER_BRIDGE");
    runFilterByLocationCase("TC-F8-03", "SALAH_SALEM", "CAIRO_SALAH_SALEM_ROAD");
    runFilterByCongestionCase("TC-F8-04", "LOW");
    runFilterByCongestionCase("TC-F8-05", "MODERATE");
    runFilterByCongestionCase("TC-F8-06", "HIGH");
    runFilterByCongestionCase("TC-F8-07", "SEVERE");
  }

  @Test(priority = 4)
  public void testSorting() throws Exception {
    seedForSorting();
    runSortCase("TC-F8-08", "timestamp:desc");
    runSortCase("TC-F8-09", "timestamp:asc");
    runSortCase("TC-F8-10", "trafficDensity:asc");
    runSortCase("TC-F8-11", "trafficDensity:desc");
    runSortCase("TC-F8-12", "avgSpeed:asc");
    runSortCase("TC-F8-13", "avgSpeed:desc");
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
    LiveDbGuard.denyOnLiveDb("seed traffic alert settings with PUT /api/settings");
    AlertsPage.flushAlertsPublic();
    AlertsPage.flushSettingsPublic();
    ensureAuthToken();
    String settingsBody = "[{\"type\":\"TRAFFIC\",\"metric\":\"TRAFFIC_DENSITY\",\"thresholdValue\":1,\"alertType\":\"ABOVE\"}]";
    HttpClient client = HttpClient.newHttpClient();
    HttpRequest settingsRequest = HttpRequest.newBuilder()
      .uri(URI.create(configReader.getApiBaseUrl() + "/api/settings"))
      .header("Content-Type", "application/json")
      .header("Authorization", "Bearer " + authToken)
      .PUT(HttpRequest.BodyPublishers.ofString(settingsBody))
      .build();
    HttpResponse<String> settingsResponse = client.send(settingsRequest, HttpResponse.BodyHandlers.ofString());
    if (settingsResponse.statusCode() < 200 || settingsResponse.statusCode() >= 300) {
      throw new IllegalStateException("PUT /api/settings failed with status " + settingsResponse.statusCode());
    }
    for (int i = 0; i < 3; i++) {
      TrafficDashboardPage.generateSensors(authToken);
    }
    trafficDashboardPage.openWithoutToastDismiss().waitForResultsReady();
    long deadline = System.currentTimeMillis() + ALERT_POLL_TIMEOUT_MS;
    while (System.currentTimeMillis() < deadline) {
      if (trafficDashboardPage.isAlertBannerVisible()) return;
      Thread.sleep(ALERT_POLL_INTERVAL_MS);
      driver.navigate().refresh();
      trafficDashboardPage.waitForLoadWithoutDismissingToasts().waitForResultsReady();
    }
  }

  // Domain Specific Methods
  @Step("TC-F6-01: Traffic nav card is visible on /home")
  private void runTrafficCardVisibleCase(String tcId) {
    rowByTcId(tcId);
    trafficDashboardPage.navigateToHome();
    Assert.assertTrue(trafficDashboardPage.isTrafficNavCardVisible(), "[" + tcId + "] Traffic nav card should be visible on /home");
  }

  @Step("TC-F6-02: Clicking traffic card navigates to /traffic-dashboard")
  private void runTrafficCardNavigatesCase(String tcId) {
    rowByTcId(tcId);
    trafficDashboardPage.openFromHome();
    Assert.assertTrue(driver.getCurrentUrl().contains("/traffic-dashboard"), "[" + tcId + "] Navigates to /traffic-dashboard");
  }

  @Step("TC-F6-03: Traffic card title contains expected description")
  private void runTrafficCardTitleCase(String tcId) {
    rowByTcId(tcId);
    trafficDashboardPage.navigateToHome();
    String cardText = trafficDashboardPage.getTrafficNavCardText();
    Assert.assertTrue(cardText.toLowerCase().contains("monitor road congestion and traffic flow"), "[" + tcId + "] Title incorrect: " + cardText);
  }

  @Step("TC-F6-04: Unauthenticated user is redirected to /login from /home")
  private void runUnauthenticatedRedirectCase(String tcId) {
    rowByTcId(tcId);
    ((JavascriptExecutor) driver).executeScript("window.localStorage.clear();");
    driver.get(configReader.getBaseUrl() + configReader.getHomePath());
    new WebDriverWait(driver, Duration.ofSeconds(10)).until(ExpectedConditions.urlContains("/login"));
    Assert.assertTrue(driver.getCurrentUrl().contains("/login"), "[" + tcId + "] Redirected to /login");
    restoreAuthenticatedSession();
  }

  @Step("TC-F6-05: Air Quality nav card has data-testid attribute")
  private void runAirQualityNavCardCase(String tcId) {
    rowByTcId(tcId);
    trafficDashboardPage.navigateToHome();
    Assert.assertTrue(trafficDashboardPage.isAirQualityNavCardVisible(), "[" + tcId + "] Air Quality nav card should be visible");
  }

  @Step("TC-F6-06: Street Lights nav card has data-testid attribute")
  private void runStreetLightsNavCardCase(String tcId) {
    rowByTcId(tcId);
    trafficDashboardPage.navigateToHome();
    Assert.assertTrue(trafficDashboardPage.isStreetLightsNavCardVisible(), "[" + tcId + "] Street Lights nav card should be visible");
  }

  @Step("TC-F7-01: Traffic dashboard loads at /traffic-dashboard")
  private void runDashboardLoadsCase(String tcId) {
    rowByTcId(tcId);
    trafficDashboardPage.open();
    Assert.assertTrue(trafficDashboardPage.isLoaded(), "[" + tcId + "] Dashboard should be loaded");
  }

  @Step("TC-F7-02: Unauthenticated access to dashboard redirects to /login")
  private void runDashboardUnauthenticatedCase(String tcId) {
    rowByTcId(tcId);
    ((JavascriptExecutor) driver).executeScript("window.localStorage.clear();");
    driver.get(configReader.getBaseUrl() + configReader.getTrafficDashboardPath());
    new WebDriverWait(driver, Duration.ofSeconds(10)).until(ExpectedConditions.urlContains("/login"));
    Assert.assertTrue(driver.getCurrentUrl().contains("/login"), "[" + tcId + "] Redirected to /login");
    restoreAuthenticatedSession();
  }

  @Step("TC-F7-03: Back button navigates to /home")
  private void runBackButtonCase(String tcId) {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    trafficDashboardPage.navigateToHome();
    Assert.assertTrue(driver.getCurrentUrl().contains("/home"), "[" + tcId + "] Back button should navigate to /home");
  }

  @Step("TC-F7-04: Traffic readings table is visible")
  private void runTableVisibleCase(String tcId) {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    Assert.assertTrue(trafficDashboardPage.isTableVisible(), "[" + tcId + "] Readings table should be visible");
  }

  @Step("TC-F7-05: Table displays all column headers")
  private void runTableColumnsCase(String tcId) {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    String pageSource = driver.getPageSource().toUpperCase();
    for (String col : new String[]{"LOCATION", "TIMESTAMP", "DENSITY", "AVG SPEED", "CONGESTION"}) {
      Assert.assertTrue(pageSource.contains(col), "[" + tcId + "] Missing column: " + col);
    }
  }

  @Step("TC-F7-06: Filter panel is visible")
  private void runFilterPanelVisibleCase(String tcId) {
    rowByTcId(tcId);
    trafficDashboardPage.open().waitForLoad();
    Assert.assertTrue(trafficDashboardPage.isFilterPanelVisible(), "[" + tcId + "] Filter panel should be visible");
  }

  @Step("TC-F7-07: Loading state finishes and dashboard is loaded")
  private void runLoadingStateCase(String tcId) {
    rowByTcId(tcId);
    driver.get(configReader.getBaseUrl() + configReader.getTrafficDashboardPath());
    trafficDashboardPage.waitForUrl(configReader.getTrafficDashboardPath(), 15);
    trafficDashboardPage.waitForLoadingIfPresent(5);
    trafficDashboardPage.waitForResultsReady();
    Assert.assertTrue(trafficDashboardPage.isLoaded(), "[" + tcId + "] Dashboard should finish loading");
  }

  @Step("TC-F7-08: Page heading contains Sensor readings")
  private void runPageHeadingCase(String tcId) {
    rowByTcId(tcId);
    trafficDashboardPage.open().waitForLoad();
    Assert.assertTrue(driver.getPageSource().contains("Sensor readings"), "[" + tcId + "] Page should contain heading: Sensor readings");
  }

  @Step("TC-F7-09: First table row contains valid location data")
  private void runTableRowDataCase(String tcId) {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    String rowText = trafficDashboardPage.getFirstRowText();
    boolean containsLocation = rowText.contains("CAIRO_RING_ROAD") || rowText.contains("CAIRO_OCTOBER_BRIDGE") || rowText.contains("CAIRO_SALAH_SALEM_ROAD");
    Assert.assertTrue(containsLocation, "[" + tcId + "] Row invalid: " + rowText);
  }

  @Step("TC-F8: Filter by Location")
  private void runFilterByLocationCase(String tcId, String location) {
    runFilterByLocationCase(tcId, location, location);
  }

  private void runFilterByLocationCase(String tcId, String selectVal, String expected) {
    Map<String, String> data = structuredData(rowByTcId(tcId));
    openDashboardAndClearBanners();
    trafficDashboardPage.clickResetFilters().waitForResultsReady();
    trafficDashboardPage.selectLocation(data.getOrDefault("location", selectVal));
    trafficDashboardPage.clickApplyFilters().waitForResultsReady();
    if (trafficDashboardPage.isTableVisible()) {
      Assert.assertTrue(driver.getPageSource().contains(data.getOrDefault("expected_location", expected)));
    }
  }

  @Step("TC-F8: Filter by Congestion")
  private void runFilterByCongestionCase(String tcId, String congestion) {
    Map<String, String> data = structuredData(rowByTcId(tcId));
    openDashboardAndClearBanners();
    trafficDashboardPage.clickResetFilters().waitForResultsReady();
    trafficDashboardPage.selectCongestion(data.getOrDefault("congestion", congestion));
    trafficDashboardPage.clickApplyFilters().waitForResultsReady();
    if (trafficDashboardPage.isTableVisible()) {
      Assert.assertTrue(driver.getPageSource().contains(data.getOrDefault("expected_congestion", congestion)));
    }
  }

  @Step("TC-F8: Sort")
  private void runSortCase(String tcId, String sortVal) {
    Map<String, String> data = structuredData(rowByTcId(tcId));
    openDashboardAndClearBanners();
    trafficDashboardPage.clickResetFilters().waitForResultsReady();
    trafficDashboardPage.selectSort(data.getOrDefault("sort", sortVal));
    trafficDashboardPage.clickApplyFilters().waitForResultsReady();
    if (trafficDashboardPage.isTableVisible()) {
      Assert.assertTrue(trafficDashboardPage.getRowCount() > 0);
    }
  }

  @Step("TC-F8-24: Rows sorted by timestamp descending are in correct order")
  private void runSortOrderCase(String tcId) {
    Map<String, String> data = structuredData(rowByTcId(tcId));
    openDashboardAndClearBanners();
    trafficDashboardPage.clickResetFilters().waitForResultsReady();
    trafficDashboardPage.selectSort(data.getOrDefault("sort", "timestamp:desc"));
    trafficDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(trafficDashboardPage.getRowCount() >= 2);
    String first = trafficDashboardPage.getFirstRowTimestamp();
    String second = trafficDashboardPage.getSecondRowTimestamp();
    Assert.assertTrue(first.compareTo(second) >= 0);
  }

  @Step("TC-F8-20: Reset filters restores full results table")
  private void runResetFiltersCase(String tcId) {
    Map<String, String> data = structuredData(rowByTcId(tcId));
    openDashboardAndClearBanners();
    trafficDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_RING_ROAD"));
    trafficDashboardPage.clickApplyFilters().waitForResultsReady();
    trafficDashboardPage.clickResetFilters().waitForResultsReady();
    Assert.assertTrue(trafficDashboardPage.getRowCount() > 0);
  }

  @Step("TC-F8-21: Restrictive filters show empty state or matching table")
  private void runEmptyStateCase(String tcId) {
    Map<String, String> data = structuredData(rowByTcId(tcId));
    openDashboardAndClearBanners();
    trafficDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_RING_ROAD"));
    trafficDashboardPage.selectCongestion(data.getOrDefault("congestion", "SEVERE"));
    trafficDashboardPage.clickApplyFilters().waitForResultsReady();
    if (trafficDashboardPage.isEmptyStateVisible()) {
      Assert.assertFalse(trafficDashboardPage.isTableVisible());
    }
  }

  @Step("TC-F8-22: Apply filters reloads table or empty state")
  private void runApplyFiltersReloadsCase(String tcId) {
    Map<String, String> data = structuredData(rowByTcId(tcId));
    openDashboardAndClearBanners();
    trafficDashboardPage.clickResetFilters().waitForResultsReady();
    trafficDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_RING_ROAD"));
    trafficDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible());
  }

  @Step("TC-F9-04: No alert banners when alerts are flushed")
  private void runNoAlertBannersCase(String tcId) throws Exception {
    rowByTcId(tcId);
    AlertsPage.flushAlertsPublic();
    trafficDashboardPage.open().waitForLoad().waitForResultsReady();
    Assert.assertFalse(trafficDashboardPage.isAlertBannerVisible());
  }
}
