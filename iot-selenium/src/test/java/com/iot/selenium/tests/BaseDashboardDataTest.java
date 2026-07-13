package com.iot.selenium.tests;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import com.iot.selenium.pages.BaseDashboardDataPage;

import org.testng.Assert;
import org.openqa.selenium.support.ui.WebDriverWait;

public abstract class BaseDashboardDataTest<T extends BaseDashboardDataPage<T>> extends BaseTest {

  protected abstract T getPage();
  protected abstract String getSheetName();

  protected abstract void openDashboardAndClearBanners();
  protected abstract void openDashboardWithoutDismissingToasts();
  protected abstract void generateSensors(String token) throws Exception;

  protected Map<String, String> rowByTcId(String tcId) {
    return Arrays.stream(rowsForSheet(getSheetName()))
      .map(this::rowData)
      .filter(rd -> tcId.equals(rd.get("tc_id")))
      .findFirst()
      .orElseThrow(() -> new IllegalStateException("Row not found for tc_id: " + tcId));
  }

  // ========== Shared Pagination Cases ==========

  protected void runNextPageCase(String tcId) {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    getPage().clickResetFilters().waitForResultsReady();
    Assert.assertTrue(
      getPage().isNextPageEnabled(),
      "[" + tcId + "] Next page button should be enabled");
    getPage().clickNextPage();
    Assert.assertTrue(
      getPage().getRowCount() > 0,
      "[" + tcId + "] Next page should display at least one row");
    Assert.assertTrue(
      getPage().isPrevPageEnabled(),
      "[" + tcId + "] Previous page button should be enabled after navigating forward");
  }

  protected void runPrevPageCase(String tcId) {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    getPage().clickResetFilters().waitForResultsReady();
    getPage().clickNextPage();
    getPage().clickPrevPage();
    Assert.assertFalse(
      getPage().isPrevPageEnabled(),
      "[" + tcId + "] Previous page button should be disabled on first page");
    Assert.assertTrue(
      getPage().getRowCount() > 0,
      "[" + tcId + "] First page should display at least one row");
  }

  protected void runFirstPageCase(String tcId) {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    getPage().clickResetFilters().waitForResultsReady();
    getPage().clickNextPage();
    getPage().clickFirstPage();
    Assert.assertFalse(
      getPage().isPrevPageEnabled(),
      "[" + tcId + "] Previous page button should be disabled on first page");
    Assert.assertFalse(
      getPage().isFirstPageEnabled(),
      "[" + tcId + "] First page button should be disabled on first page");
  }

  protected void runLastPageCase(String tcId) {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    getPage().clickResetFilters().waitForResultsReady();
    getPage().clickLastPage();
    Assert.assertFalse(
      getPage().isNextPageEnabled(),
      "[" + tcId + "] Next page button should be disabled on last page");
    Assert.assertFalse(
      getPage().isLastPageEnabled(),
      "[" + tcId + "] Last page button should be disabled on last page");
  }

  protected void runPageSizeFiveCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    openDashboardAndClearBanners();
    int expectedSize = Integer.parseInt(data.getOrDefault("page_size", "5"));
    getPage().selectPageSize(data.getOrDefault("page_size", "5")).waitForResultsReady();
    Assert.assertEquals(
      getPage().getRowCount(),
      expectedSize,
      "[" + tcId + "] Page size 5 should show exactly 5 rows");
  }

  protected void runPageSizeTenCase(String tcId) {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    openDashboardAndClearBanners();
    int expectedSize = Integer.parseInt(data.getOrDefault("page_size", "10"));
    getPage().selectPageSize(data.getOrDefault("page_size", "10")).waitForResultsReady();
    Assert.assertEquals(
      getPage().getRowCount(),
      expectedSize,
      "[" + tcId + "] Page size 10 should show exactly 10 rows");
  }

  // ========== Shared Edge Cases ==========

  protected void runFilterPanelToggleCase(String tcId) {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    Assert.assertFalse(
      getPage().isFilterPanelCollapsed(),
      "[" + tcId + "] Filter panel should be expanded initially");
    getPage().clickFilterPanelToggle().waitForFilterPanelCollapsed();
    Assert.assertTrue(
      getPage().isFilterPanelCollapsed(),
      "[" + tcId + "] Filter panel should be collapsed after toggle");
    getPage().clickFilterPanelToggle().waitForFilterPanelExpanded();
    Assert.assertFalse(
      getPage().isFilterPanelCollapsed(),
      "[" + tcId + "] Filter panel should be expanded after second toggle");
  }

  // ========== Shared Alert Banners Cases ==========

  protected void runAlertBannerVisibleCase(String tcId) {
    rowByTcId(tcId);
    Assert.assertTrue(
      getPage().isAlertBannerVisible(),
      "[" + tcId + "] Alert banner should be visible");
  }

  protected void runAlertBannerDismissCase(String tcId) {
    rowByTcId(tcId);
    getPage().waitForAlertBanner();
    int bannersBeforeDismiss = getPage().getAlertBannerCount();
    Assert.assertTrue(
      bannersBeforeDismiss > 0,
      "[" + tcId + "] Expected at least one alert banner before dismiss");
    getPage().dismissAlertBanner();
    new WebDriverWait(driver, Duration.ofSeconds(5))
      .until(d -> getPage().getAlertBannerCount() < bannersBeforeDismiss);
    Assert.assertTrue(
      getPage().getAlertBannerCount() < bannersBeforeDismiss,
      "[" + tcId + "] Manual dismiss should remove at least one alert banner");
  }

  protected void runAlertBannerAutoDismissCase(String tcId) throws Exception {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    getPage().waitForAlertBanner();
    long waitMs = Long.parseLong(data.getOrDefault("wait_ms", "7000"));
    Thread.sleep(waitMs); // Explicit wait to verify time-based auto-dismissal
    Assert.assertFalse(
      getPage().isAlertBannerVisible(),
      "[" + tcId + "] Alert banner should auto-dismiss without clicking close");
  }

  protected void runMultipleAlertBannersCase(String tcId) throws Exception {
    rowByTcId(tcId);
    for (int i = 0; i < 3; i++) {
      generateSensors(authToken);
    }
    openDashboardWithoutDismissingToasts();
    boolean multipleBannersVisible = false;
    long deadline = System.currentTimeMillis() + 3_000L;
    while (System.currentTimeMillis() < deadline) {
      if (getPage().getAlertBannerCount() >= 2) {
        multipleBannersVisible = true;
        break;
      }
      Thread.sleep(500);
    }
    Assert.assertTrue(
      multipleBannersVisible,
      "[" + tcId + "] At least two alert banners should be visible before auto-dismiss");
  }

  // ========== Shared Analytics Cases ==========

  protected void runAnalyticsPanelVisibleCase(String tcId) {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    Assert.assertTrue(
      getPage().isAnalyticsHeaderVisible(),
      "[" + tcId + "] Analytics panel header should be visible when readings exist");
  }

  protected void runAnalyticsToggleCase(String tcId) {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    Assert.assertTrue(
      getPage().isAnalyticsPanelExpanded(),
      "[" + tcId + "] Analytics panel should start expanded");
    getPage().clickAnalyticsToggle();
    Assert.assertFalse(
      getPage().isAnalyticsPanelExpanded(),
      "[" + tcId + "] Analytics panel should collapse after header click");
    getPage().clickAnalyticsToggle();
    Assert.assertTrue(
      getPage().isAnalyticsPanelExpanded(),
      "[" + tcId + "] Analytics panel should expand again after second header click");
  }

  protected void runAnalyticsMetricCardsCase(String tcId) {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    List<String> values = getPage().getAnalyticsMetricCardTexts();
    Assert.assertFalse(
      values.isEmpty(),
      "[" + tcId + "] At least one metric card should be visible");
    for (String value : values) {
      Assert.assertFalse(
        value.isBlank(),
        "[" + tcId + "] Metric card value should not be blank, got: " + value);
    }
  }

  protected void runAnalyticsChartsRenderCase(String tcId) {
    rowByTcId(tcId);
    openDashboardAndClearBanners();
    Assert.assertTrue(
      getPage().areChartsRendered(),
      "[" + tcId + "] All three charts should be rendered");
  }
}
