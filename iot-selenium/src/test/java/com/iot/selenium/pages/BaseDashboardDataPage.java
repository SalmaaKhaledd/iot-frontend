package com.iot.selenium.pages;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public abstract class BaseDashboardDataPage<T extends BaseDashboardDataPage<T>> extends BasePage {
  protected static final By BACK_BUTTON = By.cssSelector("[data-testid='back-button']");
  protected static final By FILTER_PANEL = By.cssSelector("[data-testid='filter-panel']");
  protected static final By LOCATION_SELECT = By.cssSelector("[data-testid='location-select'] [data-testid='custom-select-trigger']");
  protected static final By SORT_SELECT = By.cssSelector("[data-testid='sort-select'] [data-testid='custom-select-trigger']");
  protected static final By CUSTOM_SELECT_DROPDOWN = By.cssSelector("[data-testid='custom-select-dropdown']");
  protected static final By APPLY_FILTERS = By.cssSelector("[data-testid='apply-filters-btn']");
  protected static final By RESET_FILTERS = By.cssSelector("[data-testid='reset-filters-btn']");
  protected static final By EMPTY_STATE = By.cssSelector("[data-testid='empty-state']");
  protected static final By LOADING_STATE = By.cssSelector("[data-testid='loading-state']");
  protected static final By ERROR_STATE = By.cssSelector("[data-testid='error-state']");
  protected static final By NEXT_PAGE = By.cssSelector("[data-testid='next-page-btn']");
  protected static final By PREV_PAGE = By.cssSelector("[data-testid='prev-page-btn']");
  protected static final By FIRST_PAGE = By.cssSelector("[data-testid='first-page-btn']");
  protected static final By LAST_PAGE = By.cssSelector("[data-testid='last-page-btn']");
  protected static final By PAGE_SIZE_SELECT = By.cssSelector("[data-testid='page-size-select'] [data-testid='custom-select-trigger']");
  protected static final By ALERT_BANNER_STRIP = By.cssSelector("[data-testid='alert-banner-strip']");
  protected static final By ALERT_BANNER = By.cssSelector("[data-testid='alert-banner']");
  protected static final By ALERT_BANNER_CLOSE = By.cssSelector("[data-testid='alert-banner-close']");

  protected final int explicitWaitSeconds;

  public BaseDashboardDataPage(WebDriver driver, int explicitWaitSeconds) {
    super(driver);
    this.explicitWaitSeconds = explicitWaitSeconds;
  }

  @SuppressWarnings("unchecked")
  protected T self() {
    return (T) this;
  }

  protected abstract By getTableLocator();
  protected abstract By getRowLocator();

  public T selectLocation(String value) {
    return selectCustomOption(LOCATION_SELECT, value);
  }

  public T selectSort(String value) {
    return selectCustomOption(SORT_SELECT, value);
  }

  public T selectPageSize(String value) {
    return selectCustomOption(PAGE_SIZE_SELECT, value);
  }

  public T clickApplyFilters() {
    click(APPLY_FILTERS);
    waitForAngular();
    return self();
  }

  public T clickResetFilters() {
    click(RESET_FILTERS);
    waitForAngular();
    return self();
  }

  public boolean isTableVisible() {
    List<WebElement> elements = driver.findElements(getTableLocator());
    return !elements.isEmpty() && elements.get(0).isDisplayed();
  }

  public int getRowCount() {
    return driver.findElements(getRowLocator()).size();
  }

  public boolean isEmptyStateVisible() {
    return isElementDisplayed(EMPTY_STATE);
  }

  public boolean isFilterPanelVisible() {
    return isElementDisplayed(FILTER_PANEL);
  }

  public boolean isLoadingVisible() {
    return isElementDisplayed(LOADING_STATE);
  }

  public boolean waitForLoadingIfPresent(int timeoutSeconds) {
    try {
      new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds))
        .until(ExpectedConditions.visibilityOfElementLocated(LOADING_STATE));
      return true;
    } catch (org.openqa.selenium.TimeoutException e) {
      return false;
    }
  }

  public T waitForLoadingToFinish() {
    new WebDriverWait(driver, Duration.ofSeconds(explicitWaitSeconds))
      .until(ExpectedConditions.invisibilityOfElementLocated(LOADING_STATE));
    return self();
  }

  public T waitForResultsReady() {
    waitForLoadingToFinish();
    waitForAngular();
    return self();
  }

  public boolean isErrorStateVisible() {
    return isElementDisplayed(ERROR_STATE);
  }

  public boolean isPaginationVisible() {
    return isElementDisplayed(NEXT_PAGE) || isElementDisplayed(PREV_PAGE);
  }

  public T clickNextPage() {
    click(NEXT_PAGE);
    return waitForResultsReady();
  }

  public T clickPrevPage() {
    click(PREV_PAGE);
    return waitForResultsReady();
  }

  public T clickFirstPage() {
    click(FIRST_PAGE);
    return waitForResultsReady();
  }

  public T clickLastPage() {
    click(LAST_PAGE);
    return waitForResultsReady();
  }

  public boolean isNextPageEnabled() {
    return isButtonEnabled(NEXT_PAGE);
  }

  public boolean isPrevPageEnabled() {
    return isButtonEnabled(PREV_PAGE);
  }

  public boolean isFirstPageEnabled() {
    return isButtonEnabled(FIRST_PAGE);
  }

  public boolean isLastPageEnabled() {
    return isButtonEnabled(LAST_PAGE);
  }

  public boolean isAlertBannerStripVisible() {
    return isElementDisplayed(ALERT_BANNER_STRIP);
  }

  public boolean isAlertBannerVisible() {
    return isElementDisplayed(ALERT_BANNER);
  }

  public int getAlertBannerCount() {
    int count = 0;
    for (WebElement banner : driver.findElements(ALERT_BANNER)) {
      try {
        if (banner.isDisplayed()) count++;
      } catch (StaleElementReferenceException ignored) {}
    }
    return count;
  }

  public T waitForAlertBanner() {
    waitForVisible(ALERT_BANNER);
    return self();
  }

  public T dismissAlertBanner() {
    List<WebElement> closeButtons = driver.findElements(ALERT_BANNER_CLOSE);
    for (WebElement closeButton : closeButtons) {
      try {
        if (closeButton.isDisplayed()) {
          closeButton.click();
          waitForAngular();
          return self();
        }
      } catch (StaleElementReferenceException ignored) {}
    }
    return self();
  }

  public T dismissAllAlertBanners() {
    final int maxAttempts = 10;
    for (int attempt = 0; attempt < maxAttempts; attempt++) {
      boolean clicked = false;
      List<WebElement> closeButtons = driver.findElements(ALERT_BANNER_CLOSE);
      for (WebElement closeButton : closeButtons) {
        try {
          if (closeButton.isDisplayed()) {
            closeButton.click();
            clicked = true;
            break;
          }
        } catch (StaleElementReferenceException ignored) {}
      }
      if (!clicked) break;
      waitForAngular();
    }
    return self();
  }

  public String getFirstRowText() {
    List<WebElement> rows = driver.findElements(getRowLocator());
    if (rows.isEmpty()) return "";
    return rows.get(0).getText().trim();
  }

  public String getFirstRowTimestamp() {
    List<WebElement> rows = driver.findElements(getRowLocator());
    if (rows.isEmpty()) return "";
    return timestampTextFromRow(rows.get(0));
  }

  public String getSecondRowTimestamp() {
    List<WebElement> rows = driver.findElements(getRowLocator());
    if (rows.size() < 2) return "";
    return timestampTextFromRow(rows.get(1));
  }

  protected String timestampTextFromRow(WebElement row) {
    for (WebElement td : row.findElements(By.tagName("td"))) {
      String text = td.getText().trim();
      if (text.matches(".*\\d{4}-\\d{2}-\\d{2}.*:.*") || (text.contains("-") && text.contains(":"))) {
        return text;
      }
    }
    return "";
  }

  public boolean isAnalyticsHeaderVisible() {
    for (WebElement header : driver.findElements(By.cssSelector("[data-testid='analytics-header']"))) {
      if (header.isDisplayed()) return true;
    }
    return false;
  }

  public T clickAnalyticsToggle() {
    click(By.cssSelector("[data-testid='analytics-header']"));
    waitForAngular();
    return self();
  }

  public boolean isAnalyticsPanelExpanded() {
    try {
      return Boolean.TRUE.equals(new WebDriverWait(driver, Duration.ofSeconds(2)).until(d -> {
        try {
          List<WebElement> panels = d.findElements(By.cssSelector("[data-testid='analytics-panel']"));
          if (panels.isEmpty()) return false;
          List<WebElement> bodies = panels.get(0).findElements(By.cssSelector(".analytics-body, [data-testid='analytics-cards'], [data-testid='analytics-charts']"));
          boolean isDisplayed = bodies.stream().anyMatch(WebElement::isDisplayed);
          return isDisplayed ? true : null;
        } catch (StaleElementReferenceException e) {
          return null;
        }
      }));
    } catch (org.openqa.selenium.TimeoutException e) {
      return false;
    }
  }

  public List<String> getAnalyticsMetricCardTexts() {
    List<String> values = new ArrayList<>();
    for (WebElement card : driver.findElements(By.cssSelector(".analytics-body .analytics-card-value"))) {
      if (card.isDisplayed()) {
        String text = card.getText().trim();
        if (!text.isEmpty()) values.add(text);
      }
    }
    return values;
  }

  public boolean areChartsRendered() {
    return !driver.findElements(By.cssSelector("[data-testid='analytics-line-chart-1']")).isEmpty()
      && !driver.findElements(By.cssSelector("[data-testid='analytics-line-chart-2']")).isEmpty()
      && !driver.findElements(By.cssSelector("[data-testid='analytics-donut-chart']")).isEmpty();
  }

  public T clickFilterPanelToggle() {
    click(By.cssSelector("[data-testid='filter-panel'] .filter-header"));
    waitForAngular();
    return self();
  }

  public T waitForFilterPanelExpanded() {
    new WebDriverWait(driver, Duration.ofSeconds(5))
      .until(d -> !isFilterPanelCollapsed());
    return self();
  }

  public T waitForFilterPanelCollapsed() {
    new WebDriverWait(driver, Duration.ofSeconds(5))
      .until(d -> isFilterPanelCollapsed());
    return self();
  }

  public boolean isFilterPanelCollapsed() {
    for (int attempt = 0; attempt < 3; attempt++) {
      try {
        List<WebElement> applyButtons = driver.findElements(APPLY_FILTERS);
        if (applyButtons.isEmpty()) return true;
        return !applyButtons.get(0).isDisplayed();
      } catch (StaleElementReferenceException e) {
        if (attempt == 2) throw e;
      }
    }
    return true;
  }

  protected T selectCustomOption(By triggerLocator, String value) {
    click(triggerLocator);
    waitForVisible(CUSTOM_SELECT_DROPDOWN);
    click(optionByValue(value));
    waitForAngular();
    return self();
  }

  protected static By optionByValue(String value) {
    return By.cssSelector("[data-testid='option-" + value + "']");
  }

  protected boolean isElementDisplayed(By locator) {
    List<WebElement> elements = driver.findElements(locator);
    return !elements.isEmpty() && elements.get(0).isDisplayed();
  }

  protected boolean isButtonEnabled(By locator) {
    List<WebElement> elements = driver.findElements(locator);
    if (elements.isEmpty()) return false;
    WebElement button = elements.get(0);
    return button.isDisplayed() && button.isEnabled();
  }
}
