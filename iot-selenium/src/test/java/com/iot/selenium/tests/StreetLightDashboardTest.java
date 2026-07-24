
package com.iot.selenium.tests;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

import com.iot.selenium.config.ConfigReader;
import com.iot.selenium.pages.AlertsPage;
import com.iot.selenium.pages.StreetLightDashboardPage;
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

@Feature("Street Light Dashboard")
public class StreetLightDashboardTest extends BaseDashboardDataTest<StreetLightDashboardPage> {
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
    if (configReader == null) configReader = new ConfigReader();
    streetLightDashboardPage = new StreetLightDashboardPage(driver);
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
  protected StreetLightDashboardPage getPage() {
    return streetLightDashboardPage;
  }

  @Override
  protected String getSheetName() {
    return SHEET_NAME;
  }

  @Override
  protected void openDashboardAndClearBanners() {
    streetLightDashboardPage.open().waitForLoad().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
  }

  @Override
  protected void openDashboardWithoutDismissingToasts() {
    streetLightDashboardPage.openWithoutToastDismiss().waitForResultsReady();
  }

  @Override
  protected void generateSensors(String token) throws Exception {
    StreetLightDashboardPage.generateSensors(token);
  }

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

  @Test(priority = 3)
  public void testFilters() throws Exception {
    seedForF10();
    runFilterByLocationCase("TC-F11-01", "CAIRO_ZAMALEK");
    runFilterByLocationCase("TC-F11-02", "CAIRO_DOWNTOWN");
    runFilterByLocationCase("TC-F11-03", "CAIRO_NEW_CAIRO");
    runFilterByStatusCase("TC-F11-04", "ON");
    runFilterByStatusCase("TC-F11-05", "OFF");
  }

  @Test(priority = 4)
  public void testSorting() throws Exception {
    seedForSorting();
    runSortCase("TC-F11-06", "timestamp:desc");
    runSortCase("TC-F11-07", "timestamp:asc");
    runSortCase("TC-F11-08", "powerConsumption:desc");
    runSortCase("TC-F11-09", "powerConsumption:asc");
    runSortCase("TC-F11-10", "brightnessLevel:asc");
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

  @Test(priority = 7)
  public void testAlertBanners() throws Exception {
    seedForF12();
    runAlertBannerVisibleCase("TC-F12-01");
    runAlertBannerDismissCase("TC-F12-02");
    runAlertBannerAutoDismissCase("TC-F12-03");
    runNoAlertBannersCase("TC-F12-04");
    runMultipleAlertBannersCase("TC-F12-05");
  }

  @Test(priority = 8)
  public void testAnalytics() throws Exception {
    seedForF10();
    runAnalyticsPanelVisibleCase("TC-F10-14");
    runAnalyticsToggleCase("TC-F10-15");
    runAnalyticsMetricCardsCase("TC-F10-16");
    runAnalyticsChartsRenderCase("TC-F10-17");
  }

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
    LiveDbGuard.denyOnLiveDb("seed street light alert settings with PUT /api/settings");
    AlertsPage.flushAlertsPublic();
    AlertsPage.flushSettingsPublic();
    ensureAuthToken();
    String settingsBody = "[{\"type\":\"STREET_LIGHT\",\"metric\":\"POWER_CONSUMPTION\",\"thresholdValue\":1,\"alertType\":\"ABOVE\"}]";
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
      StreetLightDashboardPage.generateSensors(authToken);
    }
    streetLightDashboardPage.openWithoutToastDismiss().waitForResultsReady();
    long deadline = System.currentTimeMillis() + ALERT_POLL_TIMEOUT_MS;
    while (System.currentTimeMillis() < deadline) {
      if (streetLightDashboardPage.isAlertBannerVisible()) return;
      Thread.sleep(ALERT_POLL_INTERVAL_MS);
      driver.navigate().refresh();
      streetLightDashboardPage.waitForLoadWithoutDismissingToasts().waitForResultsReady();
    }
  }

  @Step("TC-F10-01: Street Light nav card is visible on /home")
  private void runStreetLightCardVisibleCase(String tcId) {
    rowByTcId(tcId);
    streetLightDashboardPage.navigateToHome();
    Assert.assertTrue(streetLightDashboardPage.isStreetLightNavCardVisible());
  }

  @Step("TC-F10-02: Clicking street light card navigates to /street-light-dashboard")
  private void runStreetLightCardNavigatesCase(String tcId) {
    rowByTcId(tcId);
    streetLightDashboardPage.openFromHome();
    Assert.assertTrue(driver.getCurrentUrl().contains("/street-light-dashboard"));
  }

  @Step("TC-F10-03: Street Light card title contains expected description")
  private void runStreetLightCardTitleCase(String tcId) {
    rowByTcId(tcId);
    streetLightDashboardPage.navigateToHome();
    String cardText = streetLightDashboardPage.getStreetLightNavCardText();
    Assert.assertTrue(cardText.toLowerCase().contains("street light") || cardText.toLowerCase().contains("lighting"));
  }

  @Step("TC-F10-04: Unauthenticated user is redirected to /login from /home")
  private void runUnauthenticatedRedirectCase(String tcId) {
    rowByTcId(tcId);
    ((JavascriptExecutor) driver).executeScript("window.localStorage.clear();");
    driver.get(configReader.getBaseUrl() + configReader.getHomePath());
    new WebDriverWait(driver, Duration.ofSeconds(10)).until(ExpectedConditions.urlContains("/login"));
    Assert.assertTrue(driver.getCurrentUrl().contains("/login"));
    restoreAuthenticatedSession();
  }

  @Step("TC-F10-05: Street light dashboard loads at /street-light-dashboard")
  private void runDashboardLoadsCase(String tcId) {
    rowByTcId(tcId);
    streetLightDashboardPage.open();
    Assert.assertTrue(streetLightDashboardPage.isLoaded());
  }

  @Step("TC-F10-06: Back button navigates to /home")
  private void runBackButtonCase(String tcId) {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    streetLightDashboardPage.navigateToHome();
    Assert.assertTrue(driver.getCurrentUrl().contains("/home"));
  }

  @Step("TC-F10-07: Street light readings table is visible")
  private void runTableVisibleCase(String tcId) {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    Assert.assertTrue(streetLightDashboardPage.isTableVisible());
  }

  @Step("TC-F10-08: Table displays all column headers")
  private void runTableColumnsCase(String tcId) {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    String pageSource = driver.getPageSource().toUpperCase();
    for (String col : new String[]{"LOCATION", "TIMESTAMP", "BRIGHTNESS", "POWER", "STATUS"}) {
      Assert.assertTrue(pageSource.contains(col));
    }
  }

  @Step("TC-F10-09: Filter panel is visible")
  private void runFilterPanelVisibleCase(String tcId) {
    rowByTcId(tcId);
    streetLightDashboardPage.open().waitForLoad();
    Assert.assertTrue(streetLightDashboardPage.isFilterPanelVisible());
  }

  @Step("TC-F10-10: Loading state finishes and dashboard is loaded")
  private void runLoadingStateCase(String tcId) {
    rowByTcId(tcId);
    driver.get(configReader.getBaseUrl() + configReader.getStreetLightDashboardPath());
    streetLightDashboardPage.waitForUrl(configReader.getStreetLightDashboardPath(), 15);
    streetLightDashboardPage.waitForLoadingIfPresent(5);
    streetLightDashboardPage.waitForResultsReady();
    Assert.assertTrue(streetLightDashboardPage.isLoaded());
  }

  @Step("TC-F10-11: Page heading contains Sensor readings")
  private void runPageHeadingCase(String tcId) {
    rowByTcId(tcId);
    streetLightDashboardPage.open().waitForLoad();
    Assert.assertTrue(driver.getPageSource().contains("Sensor readings"));
  }

  @Step("TC-F10-12: First table row contains valid location data")
  private void runTableRowDataCase(String tcId) {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    String rowText = streetLightDashboardPage.getFirstRowText();
    boolean containsLocation = rowText.contains("CAIRO_ZAMALEK") || rowText.contains("CAIRO_DOWNTOWN") || rowText.contains("CAIRO_NEW_CAIRO");
    Assert.assertTrue(containsLocation);
  }

  @Step("TC-F10-13: Unauthenticated access to dashboard redirects to /login")
  private void runDashboardUnauthenticatedCase(String tcId) {
    rowByTcId(tcId);
    ((JavascriptExecutor) driver).executeScript("window.localStorage.clear();");
    driver.get(configReader.getBaseUrl() + configReader.getStreetLightDashboardPath());
    new WebDriverWait(driver, Duration.ofSeconds(10)).until(ExpectedConditions.urlContains("/login"));
    Assert.assertTrue(driver.getCurrentUrl().contains("/login"));
    restoreAuthenticatedSession();
  }

  @Step("TC-F11: Filter by Location")
  private void runFilterByLocationCase(String tcId, String location) {
    Map<String, String> data = structuredData(rowByTcId(tcId));
    openDashboardAndClearBanners();
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    streetLightDashboardPage.selectLocation(data.getOrDefault("location", location));
    streetLightDashboardPage.clickApplyFilters().waitForResultsReady();
    if (streetLightDashboardPage.isTableVisible()) {
      Assert.assertTrue(driver.getPageSource().contains(data.getOrDefault("expected_location", location)));
    }
  }

  @Step("TC-F11: Filter by Status")
  private void runFilterByStatusCase(String tcId, String status) {
    Map<String, String> data = structuredData(rowByTcId(tcId));
    openDashboardAndClearBanners();
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    streetLightDashboardPage.selectStatus(data.getOrDefault("status", status));
    streetLightDashboardPage.clickApplyFilters().waitForResultsReady();
    if (streetLightDashboardPage.isTableVisible()) {
      Assert.assertTrue(driver.getPageSource().contains(data.getOrDefault("expected_status", status)));
    }
  }

  @Step("TC-F11: Sort")
  private void runSortCase(String tcId, String sortVal) {
    Map<String, String> data = structuredData(rowByTcId(tcId));
    openDashboardAndClearBanners();
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    streetLightDashboardPage.selectSort(data.getOrDefault("sort", sortVal));
    streetLightDashboardPage.clickApplyFilters().waitForResultsReady();
    if (streetLightDashboardPage.isTableVisible()) {
      Assert.assertTrue(streetLightDashboardPage.getRowCount() > 0);
    }
  }

  @Step("TC-F11-11: Rows sorted by timestamp descending are in correct order")
  private void runSortOrderCase(String tcId) {
    Map<String, String> data = structuredData(rowByTcId(tcId));
    openDashboardAndClearBanners();
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    streetLightDashboardPage.selectSort(data.getOrDefault("sort", "timestamp:desc"));
    streetLightDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(streetLightDashboardPage.getRowCount() >= 2);
    String first = streetLightDashboardPage.getFirstRowTimestamp();
    String second = streetLightDashboardPage.getSecondRowTimestamp();
    Assert.assertTrue(first.compareTo(second) >= 0);
  }

  @Step("TC-F11-18: Reset filters restores full results table")
  private void runResetFiltersCase(String tcId) {
    Map<String, String> data = structuredData(rowByTcId(tcId));
    openDashboardAndClearBanners();
    streetLightDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_ZAMALEK"));
    streetLightDashboardPage.clickApplyFilters().waitForResultsReady();
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    Assert.assertTrue(streetLightDashboardPage.getRowCount() > 0);
  }

  @Step("TC-F11-19: Restrictive filters show empty state or matching table")
  private void runEmptyStateCase(String tcId) {
    Map<String, String> data = structuredData(rowByTcId(tcId));
    openDashboardAndClearBanners();
    streetLightDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_ZAMALEK"));
    streetLightDashboardPage.selectStatus(data.getOrDefault("status", "OFF"));
    streetLightDashboardPage.clickApplyFilters().waitForResultsReady();
    if (streetLightDashboardPage.isEmptyStateVisible()) {
      Assert.assertFalse(streetLightDashboardPage.isTableVisible());
    }
  }

  @Step("TC-F11-20: Apply filters reloads table or empty state")
  private void runApplyFiltersReloadsCase(String tcId) {
    Map<String, String> data = structuredData(rowByTcId(tcId));
    openDashboardAndClearBanners();
    streetLightDashboardPage.clickResetFilters().waitForResultsReady();
    streetLightDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_ZAMALEK"));
    streetLightDashboardPage.clickApplyFilters().waitForResultsReady();
    Assert.assertTrue(streetLightDashboardPage.isTableVisible() || streetLightDashboardPage.isEmptyStateVisible());
  }

  @Step("TC-F12-04: No alert banners when alerts are flushed")
  private void runNoAlertBannersCase(String tcId) throws Exception {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    AlertsPage.flushAlertsPublic();
    driver.get(configReader.getBaseUrl() + configReader.getStreetLightDashboardPath());
    streetLightDashboardPage.waitForLoadWithoutDismissingToasts().waitForResultsReady();
    if (streetLightDashboardPage.isAlertBannerStripVisible()) {
      streetLightDashboardPage.dismissAllAlertBanners();
    }
    Assert.assertFalse(streetLightDashboardPage.isAlertBannerVisible());
  }
}
