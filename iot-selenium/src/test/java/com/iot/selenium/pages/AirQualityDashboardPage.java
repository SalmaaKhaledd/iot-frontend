package com.iot.selenium.pages;

import com.iot.selenium.config.ConfigReader;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class AirQualityDashboardPage extends BaseDashboardDataPage<AirQualityDashboardPage> {
  private static final By PAGE_ROOT = By.cssSelector("[data-testid='sensor-dashboard-page']");
  private static final By EXTRA_FILTER_SELECT = By.cssSelector("[data-testid='extra-filter-pollutionLevel'] [data-testid='custom-select-trigger']");
  private static final By SENSOR_TABLE = By.cssSelector("[data-testid='sensor-table']");
  private static final By SENSOR_ROWS = By.cssSelector("[data-testid='sensor-row']");
  private static final By AIR_QUALITY_NAV_CARD = By.cssSelector("[data-testid='air-quality-nav-card']");

  private final String baseUrl;
  private final String airQualityDashboardPath;
  private final String homePath;

  public AirQualityDashboardPage(WebDriver driver) {
    super(driver, new ConfigReader().getExplicitWaitSeconds());
    ConfigReader config = new ConfigReader();
    this.baseUrl = config.getBaseUrl();
    this.airQualityDashboardPath = config.getAirQualityDashboardPath();
    this.homePath = config.getHomePath();
  }

  @Override
  protected By getTableLocator() { return SENSOR_TABLE; }

  @Override
  protected By getRowLocator() { return SENSOR_ROWS; }

  public static String authenticate(String email, String password) throws Exception {
    return SensorDashboardPage.authenticate(email, password);
  }

  public static void generateSensors(String bearerToken) throws Exception {
    SensorDashboardPage.generateSensors(bearerToken);
  }

  public static void flushSensors(String bearerToken) throws Exception {
    SensorDashboardPage.flushSensors(bearerToken);
  }

  public AirQualityDashboardPage open() {
    driver.get(baseUrl + airQualityDashboardPath);
    waitForUrl(airQualityDashboardPath, explicitWaitSeconds);
    return waitForLoad();
  }

  public boolean isAirQualityNavCardVisible() {
    return isElementDisplayed(AIR_QUALITY_NAV_CARD);
  }

  public String getAirQualityNavCardText() {
    return driver.findElement(AIR_QUALITY_NAV_CARD).getText().trim();
  }

  public AirQualityDashboardPage openFromHome() {
    dismissAlertToastsIfPresent();
    click(AIR_QUALITY_NAV_CARD);
    waitForUrl(airQualityDashboardPath, explicitWaitSeconds);
    return waitForLoad();
  }

  public AirQualityDashboardPage waitForLoad() {
    dismissAlertToastsIfPresent();
    waitForVisible(PAGE_ROOT);
    waitForAngular();
    return this;
  }

  public DashboardPage navigateToHome() {
    dismissAlertToastsIfPresent();
    String url = driver.getCurrentUrl();
    if (url != null && url.contains(airQualityDashboardPath)) {
      click(BACK_BUTTON);
      waitForUrl(homePath, explicitWaitSeconds);
    } else {
      driver.get(baseUrl + homePath);
      waitForUrl(homePath, explicitWaitSeconds);
    }
    waitForAngular();
    return new DashboardPage(driver).waitForLoad();
  }

  public AirQualityDashboardPage selectPollutionLevel(String value) {
    return selectCustomOption(EXTRA_FILTER_SELECT, value);
  }

  public boolean isLoaded() {
    return isElementDisplayed(PAGE_ROOT);
  }

  public AirQualityDashboardPage openWithoutToastDismiss() {
    driver.get(baseUrl + airQualityDashboardPath);
    waitForUrl(airQualityDashboardPath, explicitWaitSeconds);
    waitForVisible(PAGE_ROOT);
    waitForAngular();
    return this;
  }

  public AirQualityDashboardPage waitForLoadWithoutDismissingToasts() {
    waitForVisible(PAGE_ROOT);
    waitForAngular();
    return this;
  }
}
