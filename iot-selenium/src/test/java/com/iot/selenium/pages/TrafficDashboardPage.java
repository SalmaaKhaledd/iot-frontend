package com.iot.selenium.pages;

import com.iot.selenium.config.ConfigReader;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

import java.util.ArrayList;
import java.util.List;

public class TrafficDashboardPage extends BaseDashboardDataPage<TrafficDashboardPage> {
  private static final By PAGE_ROOT = By.cssSelector("[data-testid='traffic-dashboard-page']");
  private static final By CONGESTION_SELECT = By.cssSelector("[data-testid='congestion-select'] [data-testid='custom-select-trigger']");
  private static final By TRAFFIC_TABLE = By.cssSelector("[data-testid='traffic-table']");
  private static final By TRAFFIC_ROWS = By.cssSelector("[data-testid='traffic-row']");
  private static final By TRAFFIC_NAV_CARD = By.cssSelector("[data-testid='traffic-nav-card']");
  private static final By ERROR_STATE_TEXT = By.cssSelector("[data-testid='error-state'] .state-text");
  private static final By FILTER_ERROR = By.cssSelector("[data-testid='filter-panel'] .filter-error");
  private static final By ALERT_BANNER_MESSAGE = By.cssSelector("[data-testid='alert-banner'] .alert-banner-message");

  private static final String FROM_DATETIME_HOST = "from-datetime";
  private static final String TO_DATETIME_HOST = "to-datetime";

  private final String baseUrl;
  private final String trafficDashboardPath;
  private final String homePath;

  public TrafficDashboardPage(WebDriver driver) {
    super(driver, new ConfigReader().getExplicitWaitSeconds());
    ConfigReader config = new ConfigReader();
    this.baseUrl = config.getBaseUrl();
    this.trafficDashboardPath = config.getTrafficDashboardPath();
    this.homePath = config.getHomePath();
  }

  @Override
  protected By getTableLocator() { return TRAFFIC_TABLE; }

  @Override
  protected By getRowLocator() { return TRAFFIC_ROWS; }

  public static String authenticate(String email, String password) throws Exception {
    return SensorDashboardPage.authenticate(email, password);
  }

  public static void generateSensors(String bearerToken) throws Exception {
    SensorDashboardPage.generateSensors(bearerToken);
  }

  public static void flushSensors(String bearerToken) throws Exception {
    SensorDashboardPage.flushSensors(bearerToken);
  }

  public TrafficDashboardPage open() {
    driver.get(baseUrl + trafficDashboardPath);
    waitForUrl(trafficDashboardPath, explicitWaitSeconds);
    return waitForLoad();
  }

  public boolean isTrafficNavCardVisible() {
    return isElementDisplayed(TRAFFIC_NAV_CARD);
  }

  public boolean isAirQualityNavCardVisible() {
    return isElementDisplayed(By.cssSelector("[data-testid='air-quality-nav-card']"));
  }

  public boolean isStreetLightsNavCardVisible() {
    return isElementDisplayed(By.cssSelector("[data-testid='street-light-nav-card']"));
  }

  public String getTrafficNavCardText() {
    return driver.findElement(TRAFFIC_NAV_CARD).getText().trim();
  }

  public TrafficDashboardPage openFromHome() {
    dismissAlertToastsIfPresent();
    click(TRAFFIC_NAV_CARD);
    waitForUrl(trafficDashboardPath, explicitWaitSeconds);
    return waitForLoad();
  }

  public TrafficDashboardPage waitForLoad() {
    dismissAlertToastsIfPresent();
    waitForVisible(PAGE_ROOT);
    waitForAngular();
    return this;
  }

  public DashboardPage navigateToHome() {
    dismissAlertToastsIfPresent();
    String url = driver.getCurrentUrl();
    if (url != null && url.contains(trafficDashboardPath)) {
      click(BACK_BUTTON);
      waitForUrl(homePath, explicitWaitSeconds);
    } else {
      driver.get(baseUrl + homePath);
      waitForUrl(homePath, explicitWaitSeconds);
    }
    waitForAngular();
    return new DashboardPage(driver).waitForLoad();
  }

  public TrafficDashboardPage selectCongestion(String value) {
    return selectCustomOption(CONGESTION_SELECT, value);
  }

  public boolean isLoaded() {
    return isElementDisplayed(PAGE_ROOT);
  }

  public String getErrorMessage() {
    return firstDisplayedText(ERROR_STATE_TEXT);
  }

  public String waitForErrorMessage() {
    return waitForErrorText(ERROR_STATE_TEXT, explicitWaitSeconds);
  }

  public String getAlertBannerMessage() {
    for (WebElement message : driver.findElements(ALERT_BANNER_MESSAGE)) {
      if (message.isDisplayed()) return message.getText().trim();
    }
    return "";
  }

  public List<String> getAlertBannerMessages() {
    List<String> messages = new ArrayList<>();
    for (WebElement message : driver.findElements(ALERT_BANNER_MESSAGE)) {
      if (message.isDisplayed()) messages.add(message.getText().trim());
    }
    return messages;
  }

  public TrafficDashboardPage setFromDate(String isoDate) {
    selectDateOnly(FROM_DATETIME_HOST, isoDate);
    return this;
  }

  public TrafficDashboardPage setToDate(String isoDate) {
    selectDateOnly(TO_DATETIME_HOST, isoDate);
    return this;
  }

  public TrafficDashboardPage setFromDateTime(String isoDate, int hour24, int minute) {
    selectDateTime(FROM_DATETIME_HOST, isoDate, hour24, minute);
    return this;
  }

  public TrafficDashboardPage setToDateTime(String isoDate, int hour24, int minute) {
    selectDateTime(TO_DATETIME_HOST, isoDate, hour24, minute);
    return this;
  }

  public boolean isDateRangeErrorVisible() {
    return isElementDisplayed(FILTER_ERROR);
  }

  public boolean isTimeRangeErrorVisible() {
    List<WebElement> errors = driver.findElements(FILTER_ERROR);
    return errors.stream().anyMatch(WebElement::isDisplayed);
  }

  private By dateTimeScope(String hostTestId, String innerSelector) {
    return By.cssSelector("[data-testid='" + hostTestId + "'] " + innerSelector);
  }

  private void selectDateOnly(String hostTestId, String isoDate) {
    click(dateTimeScope(hostTestId, "[data-testid='dtp-trigger']"));
    waitForVisible(dateTimeScope(hostTestId, "[data-testid='dtp-popup']"));
    click(dateTimeScope(hostTestId, "[data-testid='day-" + isoDate + "']"));
    closeDateTimePicker();
    waitForAngular();
  }

  private void selectDateTime(String hostTestId, String isoDate, int hour24, int minute) {
    click(dateTimeScope(hostTestId, "[data-testid='dtp-trigger']"));
    waitForVisible(dateTimeScope(hostTestId, "[data-testid='dtp-popup']"));
    click(dateTimeScope(hostTestId, "[data-testid='day-" + isoDate + "']"));

    WebElement timeToggle = driver.findElement(dateTimeScope(hostTestId, ".dtp-toggle"));
    if (!timeToggle.getAttribute("class").contains("on")) {
      click(dateTimeScope(hostTestId, ".dtp-toggle-row"));
    }

    int hour12 = hour24 % 12;
    if (hour12 == 0) hour12 = 12;
    boolean pm = hour24 >= 12;

    WebElement hourInput = waitForVisible(dateTimeScope(hostTestId, "[data-testid='dtp-hour-input']"));
    hourInput.clear();
    hourInput.sendKeys(String.valueOf(hour12));

    WebElement minuteInput = waitForVisible(dateTimeScope(hostTestId, "[data-testid='dtp-minute-input']"));
    minuteInput.clear();
    minuteInput.sendKeys(String.valueOf(minute));

    setPeriodForPicker(hostTestId, pm);
    closeDateTimePicker();
    waitForAngular();
  }

  private void setPeriodForPicker(String hostTestId, boolean pm) {
    List<WebElement> periodButtons = driver.findElements(
      By.cssSelector("[data-testid='" + hostTestId + "'] .dtp-period-btn"));
    if (periodButtons.size() < 2) return;

    WebElement target = pm ? periodButtons.get(1) : periodButtons.get(0);
    if (!target.getAttribute("class").contains("active")) {
      target.click();
    }
  }

  private void closeDateTimePicker() {
    click(By.cssSelector(".page-title"));
  }

  public TrafficDashboardPage openWithoutToastDismiss() {
    driver.get(baseUrl + trafficDashboardPath);
    waitForUrl(trafficDashboardPath, explicitWaitSeconds);
    waitForVisible(PAGE_ROOT);
    waitForAngular();
    return this;
  }

  public TrafficDashboardPage waitForLoadWithoutDismissingToasts() {
    waitForVisible(PAGE_ROOT);
    waitForAngular();
    return this;
  }
}
