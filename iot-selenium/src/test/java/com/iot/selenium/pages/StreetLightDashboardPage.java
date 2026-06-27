package com.iot.selenium.pages;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import com.iot.selenium.config.ConfigReader;

import org.openqa.selenium.By;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class StreetLightDashboardPage extends BasePage {
  private static final By PAGE_ROOT = By.cssSelector("[data-testid='sensor-dashboard-page']");
  private static final By BACK_BUTTON = By.cssSelector("[data-testid='back-button']");
  private static final By FILTER_PANEL = By.cssSelector("[data-testid='filter-panel']");
  private static final By LOCATION_SELECT = By.cssSelector("[data-testid='location-select'] [data-testid='custom-select-trigger']");
  private static final By EXTRA_FILTER_SELECT = By.cssSelector("[data-testid='extra-filter-status'] [data-testid='custom-select-trigger']");
  private static final By SORT_SELECT = By.cssSelector("[data-testid='sort-select'] [data-testid='custom-select-trigger']");
  private static final By CUSTOM_SELECT_DROPDOWN = By.cssSelector("[data-testid='custom-select-dropdown']");
  private static final By APPLY_FILTERS = By.cssSelector("[data-testid='apply-filters-btn']");
  private static final By RESET_FILTERS = By.cssSelector("[data-testid='reset-filters-btn']");
  private static final By SENSOR_TABLE = By.cssSelector("[data-testid='sensor-table']");
  private static final By SENSOR_ROWS = By.cssSelector("[data-testid='sensor-row']");
  private static final By EMPTY_STATE = By.cssSelector("[data-testid='empty-state']");
  private static final By LOADING_STATE = By.cssSelector("[data-testid='loading-state']");
  private static final By ERROR_STATE = By.cssSelector("[data-testid='error-state']");
  private static final By NEXT_PAGE = By.cssSelector("[data-testid='next-page-btn']");
  private static final By PREV_PAGE = By.cssSelector("[data-testid='prev-page-btn']");
  private static final By FIRST_PAGE = By.cssSelector("[data-testid='first-page-btn']");
  private static final By LAST_PAGE = By.cssSelector("[data-testid='last-page-btn']");
  private static final By PAGE_SIZE_SELECT = By.cssSelector("[data-testid='page-size-select'] [data-testid='custom-select-trigger']");
  private static final By ALERT_BANNER_STRIP = By.cssSelector("[data-testid='alert-banner-strip']");
  private static final By ALERT_BANNER = By.cssSelector("[data-testid='alert-banner']");
  private static final By ALERT_BANNER_CLOSE = By.cssSelector("[data-testid='alert-banner-close']");
  private static final By STREET_LIGHT_NAV_CARD = By.cssSelector("[data-testid='street-lights-nav-card']");

  private final String baseUrl;
  private final String apiBaseUrl;
  private final String streetLightDashboardPath;
  private final String homePath;
  private final int explicitWaitSeconds;

  public StreetLightDashboardPage(WebDriver driver) {
    super(driver);
    ConfigReader config = new ConfigReader();
    this.baseUrl = config.getBaseUrl();
    this.apiBaseUrl = config.getApiBaseUrl();
    this.streetLightDashboardPath = config.getStreetLightDashboardPath();
    this.homePath = config.getHomePath();
    this.explicitWaitSeconds = config.getExplicitWaitSeconds();
  }

  public static String authenticate(String email, String password) throws Exception {
    return SensorDashboardPage.authenticate(email, password);
  }

  public static void generateSensors(String bearerToken) throws Exception {
    SensorDashboardPage.generateSensors(bearerToken);
  }

  public static void flushSensors(String bearerToken) throws Exception {
    SensorDashboardPage.flushSensors(bearerToken);
  }

  public StreetLightDashboardPage open() {
    driver.get(baseUrl + streetLightDashboardPath);
    waitForUrl(streetLightDashboardPath, explicitWaitSeconds);
    return waitForLoad();
  }

  public boolean isStreetLightNavCardVisible() {
    return driver.findElements(STREET_LIGHT_NAV_CARD).stream()
      .anyMatch(e -> e.isDisplayed());
  }

  public String getStreetLightNavCardText() {
    return driver.findElement(STREET_LIGHT_NAV_CARD).getText().trim();
  }

  public StreetLightDashboardPage openFromHome() {
    dismissAlertToastsIfPresent();
    click(STREET_LIGHT_NAV_CARD);
    waitForUrl(streetLightDashboardPath, explicitWaitSeconds);
    return waitForLoad();
  }

  public StreetLightDashboardPage waitForLoad() {
    dismissAlertToastsIfPresent();
    waitForVisible(PAGE_ROOT);
    waitForAngular();
    return this;
  }

  public DashboardPage navigateToHome() {
    dismissAlertToastsIfPresent();
    String url = driver.getCurrentUrl();
    if (url != null && url.contains(streetLightDashboardPath)) {
      click(BACK_BUTTON);
      waitForUrl(homePath, explicitWaitSeconds);
    } else {
      driver.get(baseUrl + homePath);
      waitForUrl(homePath, explicitWaitSeconds);
    }
    waitForAngular();
    return new DashboardPage(driver).waitForLoad();
  }

  public StreetLightDashboardPage selectLocation(String value) {
    return selectCustomOption(LOCATION_SELECT, value);
  }

  public StreetLightDashboardPage selectStatus(String value) {
    return selectCustomOption(EXTRA_FILTER_SELECT, value);
  }

  public StreetLightDashboardPage selectSort(String value) {
    return selectCustomOption(SORT_SELECT, value);
  }

  public StreetLightDashboardPage selectPageSize(String value) {
    return selectCustomOption(PAGE_SIZE_SELECT, value);
  }

  public StreetLightDashboardPage clickApplyFilters() {
    click(APPLY_FILTERS);
    waitForAngular();
    return this;
  }

  public StreetLightDashboardPage clickResetFilters() {
    click(RESET_FILTERS);
    waitForAngular();
    return this;
  }

  public boolean isLoaded() {
    return isElementDisplayed(PAGE_ROOT);
  }

  public boolean isTableVisible() {
    List<WebElement> elements = driver.findElements(SENSOR_TABLE);
    return !elements.isEmpty() && elements.get(0).isDisplayed();
  }

  public int getRowCount() {
    return driver.findElements(SENSOR_ROWS).size();
  }

  public boolean isEmptyStateVisible() {
    List<WebElement> elements = driver.findElements(EMPTY_STATE);
    return !elements.isEmpty() && elements.get(0).isDisplayed();
  }

  public boolean isFilterPanelVisible() {
    List<WebElement> elements = driver.findElements(FILTER_PANEL);
    return !elements.isEmpty() && elements.get(0).isDisplayed();
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

  public StreetLightDashboardPage waitForLoadingToFinish() {
    new WebDriverWait(driver, Duration.ofSeconds(explicitWaitSeconds))
      .until(ExpectedConditions.invisibilityOfElementLocated(LOADING_STATE));
    return this;
  }

  public StreetLightDashboardPage waitForResultsReady() {
    waitForLoadingToFinish();
    waitForAngular();
    return this;
  }

  public boolean isErrorStateVisible() {
    return isElementDisplayed(ERROR_STATE);
  }

  public boolean isPaginationVisible() {
    return isElementDisplayed(NEXT_PAGE) || isElementDisplayed(PREV_PAGE);
  }

  public StreetLightDashboardPage clickNextPage() {
    click(NEXT_PAGE);
    return waitForResultsReady();
  }

  public StreetLightDashboardPage clickPrevPage() {
    click(PREV_PAGE);
    return waitForResultsReady();
  }

  public StreetLightDashboardPage clickFirstPage() {
    click(FIRST_PAGE);
    return waitForResultsReady();
  }

  public StreetLightDashboardPage clickLastPage() {
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

  public StreetLightDashboardPage waitForAlertBanner() {
    waitForVisible(ALERT_BANNER);
    return this;
  }

  public StreetLightDashboardPage dismissAlertBanner() {
    List<WebElement> closeButtons = driver.findElements(ALERT_BANNER_CLOSE);
    for (WebElement closeButton : closeButtons) {
      try {
        if (closeButton.isDisplayed()) {
          closeButton.click();
          waitForAngular();
          return this;
        }
      } catch (StaleElementReferenceException ignored) {}
    }
    return this;
  }

  public StreetLightDashboardPage dismissAllAlertBanners() {
    final int maxAttempts = 10;
    for (int attempt = 0; attempt < maxAttempts; attempt++) {
      boolean clicked = false;
      List<WebElement> closeButtons = driver.findElements(ALERT_BANNER_CLOSE);
      for (WebElement closeButton : closeButtons) {
        try {
          if (closeButton.isDisplayed()) {
            closeButton.click();
            clicked = true;
          }
        } catch (StaleElementReferenceException ignored) {}
      }
      if (!clicked) break;
      waitForAngular();
    }
    return this;
  }

  public StreetLightDashboardPage openWithoutToastDismiss() {
    driver.get(baseUrl + streetLightDashboardPath);
    waitForUrl(streetLightDashboardPath, explicitWaitSeconds);
    waitForVisible(PAGE_ROOT);
    waitForAngular();
    return this;
  }

  public StreetLightDashboardPage waitForLoadWithoutDismissingToasts() {
    waitForVisible(PAGE_ROOT);
    waitForAngular();
    return this;
  }

  public String getFirstRowText() {
    List<WebElement> rows = driver.findElements(SENSOR_ROWS);
    if (rows.isEmpty()) return "";
    return rows.get(0).getText().trim();
  }

  public String getFirstRowTimestamp() {
    List<WebElement> rows = driver.findElements(SENSOR_ROWS);
    if (rows.isEmpty()) return "";
    return timestampTextFromRow(rows.get(0));
  }

  public String getSecondRowTimestamp() {
    List<WebElement> rows = driver.findElements(SENSOR_ROWS);
    if (rows.size() < 2) return "";
    return timestampTextFromRow(rows.get(1));
  }

  private String timestampTextFromRow(WebElement row) {
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

  public StreetLightDashboardPage clickAnalyticsToggle() {
    click(By.cssSelector("[data-testid='analytics-header']"));
    waitForAngular();
    return this;
  }

  public boolean isAnalyticsPanelExpanded() {
    List<WebElement> charts = driver.findElements(By.id("speedChart"));
    for (int i = 0; i < charts.size(); i++) {
      try {
        if (charts.get(i).isDisplayed()) return true;
      } catch (StaleElementReferenceException ignored) {
        charts = driver.findElements(By.id("speedChart"));
        i = -1;
      }
    }
    return false;
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
    return !driver.findElements(By.id("speedChart")).isEmpty()
      && !driver.findElements(By.id("densityChart")).isEmpty()
      && !driver.findElements(By.id("donutChart")).isEmpty();
  }

  public StreetLightDashboardPage clickFilterPanelToggle() {
    click(By.cssSelector("[data-testid='filter-panel'] .filter-header"));
    waitForAngular();
    return this;
  }

  public StreetLightDashboardPage waitForFilterPanelExpanded() {
    new WebDriverWait(driver, Duration.ofSeconds(5))
      .until(d -> !isFilterPanelCollapsed());
    return this;
  }

  public StreetLightDashboardPage waitForFilterPanelCollapsed() {
    new WebDriverWait(driver, Duration.ofSeconds(5))
      .until(d -> isFilterPanelCollapsed());
    return this;
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

  private StreetLightDashboardPage selectCustomOption(By triggerLocator, String value) {
    click(triggerLocator);
    waitForVisible(CUSTOM_SELECT_DROPDOWN);
    click(optionByValue(value));
    waitForAngular();
    return this;
  }

  private static By optionByValue(String value) {
    return By.cssSelector("[data-testid='option-" + value + "']");
  }

  private boolean isElementDisplayed(By locator) {
    List<WebElement> elements = driver.findElements(locator);
    return !elements.isEmpty() && elements.get(0).isDisplayed();
  }

  private boolean isButtonEnabled(By locator) {
    List<WebElement> elements = driver.findElements(locator);
    if (elements.isEmpty()) return false;
    WebElement button = elements.get(0);
    return button.isDisplayed() && button.isEnabled();
  }
}
