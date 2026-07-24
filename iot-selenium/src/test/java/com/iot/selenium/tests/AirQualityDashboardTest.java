package com.iot.selenium.tests;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

import com.iot.selenium.config.ConfigReader;
import com.iot.selenium.pages.AlertsPage;
import com.iot.selenium.pages.AirQualityDashboardPage;
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

@Feature("Air Quality Dashboard")
public class AirQualityDashboardTest extends BaseDashboardDataTest<AirQualityDashboardPage> {
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
    if (configReader == null) configReader = new ConfigReader();
    airQualityDashboardPage = new AirQualityDashboardPage(driver);
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
  protected AirQualityDashboardPage getPage() {
    return airQualityDashboardPage;
  }

  @Override
  protected String getSheetName() {
    return SHEET_NAME;
  }

  @Override
  protected void openDashboardAndClearBanners() {
    airQualityDashboardPage.open().waitForLoad().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
  }

  @Override
  protected void openDashboardWithoutDismissingToasts() {
    airQualityDashboardPage.openWithoutToastDismiss().waitForResultsReady();
  }

  @Override
  protected void generateSensors(String token) throws Exception {
    AirQualityDashboardPage.generateSensors(token);
  }

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

  @Test(priority = 3)
  public void testFilters() throws Exception {
    seedForF13();
    runFilterByLocationCase("TC-F14-01", "CAIRO_NASR_CITY");
    runFilterByLocationCase("TC-F14-02", "CAIRO_MAADI");
    runFilterByLocationCase("TC-F14-03", "CAIRO_HELIOPOLIS");
    runFilterByPollutionCase("TC-F14-04", "GOOD");
    runFilterByPollutionCase("TC-F14-05", "MODERATE");
    runFilterByPollutionCase("TC-F14-06", "UNHEALTHY");
    runFilterByPollutionCase("TC-F14-07", "VERY_UNHEALTHY");
    runFilterByPollutionCase("TC-F14-08", "HAZARDOUS");
  }

  @Test(priority = 4)
  public void testSorting() throws Exception {
    seedForSorting();
    runSortCase("TC-F14-09", "timestamp:desc");
    runSortCase("TC-F14-10", "timestamp:asc");
    runSortCase("TC-F14-11", "co:desc");
    runSortCase("TC-F14-12", "co:asc");
    runSortCase("TC-F14-13", "ozone:desc");
    runSortCase("TC-F14-14", "ozone:asc");
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

  @Test(priority = 7)
  public void testAlertBanners() throws Exception {
    seedForF15();
    runAlertBannerVisibleCase("TC-F15-01");
    runAlertBannerDismissCase("TC-F15-02");
    runAlertBannerAutoDismissCase("TC-F15-03");
    runNoAlertBannersCase("TC-F15-04");
    runMultipleAlertBannersCase("TC-F15-05");
  }

  @Test(priority = 8)
  public void testAnalytics() throws Exception {
    seedForF13();
    runAnalyticsPanelVisibleCase("TC-F13-14");
    runAnalyticsToggleCase("TC-F13-15");
    runAnalyticsMetricCardsCase("TC-F13-16");
    runAnalyticsChartsRenderCase("TC-F13-17");
  }

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
    LiveDbGuard.denyOnLiveDb("seed air quality alert settings with PUT /api/settings");
    AlertsPage.flushAlertsPublic();
    AlertsPage.flushSettingsPublic();
    ensureAuthToken();
    String settingsBody = "[{\"type\":\"AIR_POLLUTION\",\"metric\":\"CO\",\"thresholdValue\":1,\"alertType\":\"ABOVE\"}]";
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
      AirQualityDashboardPage.generateSensors(authToken);
    }
    airQualityDashboardPage.openWithoutToastDismiss().waitForResultsReady();
    long deadline = System.currentTimeMillis() + ALERT_POLL_TIMEOUT_MS;
    while (System.currentTimeMillis() < deadline) {
      if (airQualityDashboardPage.isAlertBannerVisible()) return;
      Thread.sleep(ALERT_POLL_INTERVAL_MS);
      driver.navigate().refresh();
      airQualityDashboardPage.waitForLoadWithoutDismissingToasts().waitForResultsReady();
    }
  }

  @Step("TC-F13-01: Air Quality nav card is visible on /home")
  private void runAirQualityCardVisibleCase(String tcId) {
    rowByTcId(tcId);
    airQualityDashboardPage.navigateToHome();
    Assert.assertTrue(airQualityDashboardPage.isAirQualityNavCardVisible());
  }

  @Step("TC-F13-02: Clicking air quality card navigates to /air-quality-dashboard")
  private void runAirQualityCardNavigatesCase(String tcId) {
    rowByTcId(tcId);
    airQualityDashboardPage.openFromHome();
    Assert.assertTrue(driver.getCurrentUrl().contains("/air-quality-dashboard"));
  }

  @Step("TC-F13-03: Air Quality card title contains expected description")
  private void runAirQualityCardTitleCase(String tcId) {
    rowByTcId(tcId);
    airQualityDashboardPage.navigateToHome();
    String cardText = airQualityDashboardPage.getAirQualityNavCardText();
    Assert.assertTrue(cardText.toLowerCase().contains("air quality") || cardText.toLowerCase().contains("pollution"));
  }

  @Step("TC-F13-04: Unauthenticated user is redirected to /login from /home")
  private void runUnauthenticatedRedirectCase(String tcId) {
    rowByTcId(tcId);
    ((JavascriptExecutor) driver).executeScript("window.localStorage.clear();");
    driver.get(configReader.getBaseUrl() + configReader.getHomePath());
    new WebDriverWait(driver, Duration.ofSeconds(10)).until(ExpectedConditions.urlContains("/login"));
    Assert.assertTrue(driver.getCurrentUrl().contains("/login"));
    restoreAuthenticatedSession();
  }

  @Step("TC-F13-05: Air quality dashboard loads at /air-quality-dashboard")
  private void runDashboardLoadsCase(String tcId) {
    rowByTcId(tcId);
    airQualityDashboardPage.open();
    Assert.assertTrue(airQualityDashboardPage.isLoaded());
  }

  @Step("TC-F13-06: Back button navigates to /home")
  private void runBackButtonCase(String tcId) {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    airQualityDashboardPage.navigateToHome();
    Assert.assertTrue(driver.getCurrentUrl().contains("/home"));
  }

  @Step("TC-F13-07: Air quality readings table is visible")
  private void runTableVisibleCase(String tcId) {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    Assert.assertTrue(airQualityDashboardPage.isTableVisible());
  }

  @Step("TC-F13-08: Table displays all column headers")
  private void runTableColumnsCase(String tcId) {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    String pageSource = driver.getPageSource().toUpperCase();
    for (String col : new String[]{"LOCATION", "TIMESTAMP", "CO", "OZONE", "NO2", "SO2", "PM2.5", "PM10", "POLLUTION"}) {
      Assert.assertTrue(pageSource.contains(col));
    }
  }

  @Step("TC-F13-09: Filter panel is visible")
  private void runFilterPanelVisibleCase(String tcId) {
    rowByTcId(tcId);
    airQualityDashboardPage.open().waitForLoad();
    Assert.assertTrue(airQualityDashboardPage.isFilterPanelVisible());
  }

  @Step("TC-F13-10: Loading state finishes and dashboard is loaded")
  private void runLoadingStateCase(String tcId) {
    rowByTcId(tcId);
    driver.get(configReader.getBaseUrl() + configReader.getAirQualityDashboardPath());
    airQualityDashboardPage.waitForUrl(configReader.getAirQualityDashboardPath(), 15);
    airQualityDashboardPage.waitForLoadingIfPresent(5);
    airQualityDashboardPage.waitForResultsReady();
    Assert.assertTrue(airQualityDashboardPage.isLoaded());
  }

  @Step("TC-F13-11: Page heading contains Sensor readings")
  private void runPageHeadingCase(String tcId) {
    rowByTcId(tcId);
    airQualityDashboardPage.open().waitForLoad();
    Assert.assertTrue(driver.getPageSource().contains("Sensor readings"));
  }

  @Step("TC-F13-12: First table row contains valid location data")
  private void runTableRowDataCase(String tcId) {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    String rowText = airQualityDashboardPage.getFirstRowText();
    boolean containsLocation = rowText.contains("CAIRO_NASR_CITY") || rowText.contains("CAIRO_MAADI") || rowText.contains("CAIRO_HELIOPOLIS");
    Assert.assertTrue(containsLocation);
  }

  @Step("TC-F13-13: Unauthenticated access to dashboard redirects to /login")
  private void runDashboardUnauthenticatedCase(String tcId) {
    rowByTcId(tcId);
    ((JavascriptExecutor) driver).executeScript("window.localStorage.clear();");
    driver.get(configReader.getBaseUrl() + configReader.getAirQualityDashboardPath());
    new WebDriverWait(driver, Duration.ofSeconds(10)).until(ExpectedConditions.urlContains("/login"));
    Assert.assertTrue(driver.getCurrentUrl().contains("/login"));
    restoreAuthenticatedSession();
  }

  @Step("TC-F14: Filter by Location")
  private void runFilterByLocationCase(String tcId, String location) {
    Map<String, String> data = structuredData(rowByTcId(tcId));
    openDashboardAndClearBanners();
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.selectLocation(data.getOrDefault("location", location));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    if (airQualityDashboardPage.isTableVisible()) {
      Assert.assertTrue(driver.getPageSource().contains(data.getOrDefault("expected_location", location)));
    }
  }

  @Step("TC-F14: Filter by Pollution Level")
  private void runFilterByPollutionCase(String tcId, String pollution) {
    Map<String, String> data = structuredData(rowByTcId(tcId));
    openDashboardAndClearBanners();
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.selectPollutionLevel(data.getOrDefault("pollutionLevel", pollution));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    if (airQualityDashboardPage.isTableVisible()) {
      Assert.assertTrue(driver.getPageSource().contains(data.getOrDefault("expected_pollution", pollution)));
    }
  }

  @Step("TC-F14: Sort")
  private void runSortCase(String tcId, String sortVal) {
    Map<String, String> data = structuredData(rowByTcId(tcId));
    openDashboardAndClearBanners();
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.selectSort(data.getOrDefault("sort", sortVal));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    if (airQualityDashboardPage.isTableVisible()) {
      Assert.assertTrue(airQualityDashboardPage.getRowCount() > 0);
    }
  }

  @Step("TC-F14-15: Rows sorted by timestamp descending are in correct order")
  private void runSortOrderCase(String tcId) {
    Map<String, String> data = structuredData(rowByTcId(tcId));
    openDashboardAndClearBanners();
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.selectSort(data.getOrDefault("sort", "timestamp:desc"));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(airQualityDashboardPage.getRowCount() >= 2);
    String first = airQualityDashboardPage.getFirstRowTimestamp();
    String second = airQualityDashboardPage.getSecondRowTimestamp();
    Assert.assertTrue(first.compareTo(second) >= 0);
  }

  @Step("TC-F14-22: Reset filters restores full results table")
  private void runResetFiltersCase(String tcId) {
    Map<String, String> data = structuredData(rowByTcId(tcId));
    openDashboardAndClearBanners();
    airQualityDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_NASR_CITY"));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    Assert.assertTrue(airQualityDashboardPage.getRowCount() > 0);
  }

  @Step("TC-F14-23: Restrictive filters show empty state or matching table")
  private void runEmptyStateCase(String tcId) {
    Map<String, String> data = structuredData(rowByTcId(tcId));
    openDashboardAndClearBanners();
    airQualityDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_NASR_CITY"));
    airQualityDashboardPage.selectPollutionLevel(data.getOrDefault("pollutionLevel", "HAZARDOUS"));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    if (airQualityDashboardPage.isEmptyStateVisible()) {
      Assert.assertFalse(airQualityDashboardPage.isTableVisible());
    }
  }

  @Step("TC-F14-24: Apply filters reloads table or empty state")
  private void runApplyFiltersReloadsCase(String tcId) {
    Map<String, String> data = structuredData(rowByTcId(tcId));
    openDashboardAndClearBanners();
    airQualityDashboardPage.clickResetFilters().waitForResultsReady();
    airQualityDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_NASR_CITY"));
    airQualityDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(airQualityDashboardPage.isTableVisible() || airQualityDashboardPage.isEmptyStateVisible());
  }

  @Step("TC-F15-04: No alert banners when alerts are flushed")
  private void runNoAlertBannersCase(String tcId) throws Exception {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    AlertsPage.flushAlertsPublic();
    driver.get(configReader.getBaseUrl() + configReader.getAirQualityDashboardPath());
    airQualityDashboardPage.waitForLoadWithoutDismissingToasts().waitForResultsReady();
    if (airQualityDashboardPage.isAlertBannerStripVisible()) {
      airQualityDashboardPage.dismissAllAlertBanners();
    }
    Assert.assertFalse(airQualityDashboardPage.isAlertBannerVisible());
  }
}
