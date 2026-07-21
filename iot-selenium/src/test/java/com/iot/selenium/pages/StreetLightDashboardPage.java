package com.iot.selenium.pages;

import com.iot.selenium.config.ConfigReader;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class StreetLightDashboardPage extends BaseDashboardDataPage<StreetLightDashboardPage> {
  private static final By PAGE_ROOT = By.cssSelector("[data-testid='sensor-dashboard-page']");
  private static final By EXTRA_FILTER_SELECT = By.cssSelector("[data-testid='extra-filter-status'] [data-testid='custom-select-trigger']");
  private static final By SENSOR_TABLE = By.cssSelector("[data-testid='sensor-table']");
  private static final By SENSOR_ROWS = By.cssSelector("[data-testid='sensor-row']");
  private static final By STREET_LIGHT_NAV_CARD = By.cssSelector("[data-testid='street-light-nav-card']");

  private final String baseUrl;
  private final String streetLightDashboardPath;
  private final String homePath;

  public StreetLightDashboardPage(WebDriver driver) {
    super(driver, new ConfigReader().getExplicitWaitSeconds());
    ConfigReader config = new ConfigReader();
    this.baseUrl = config.getBaseUrl();
    this.streetLightDashboardPath = config.getStreetLightDashboardPath();
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

  public StreetLightDashboardPage open() {
    driver.get(baseUrl + streetLightDashboardPath);
    waitForUrl(streetLightDashboardPath, explicitWaitSeconds);
    return waitForLoad();
  }

  public boolean isStreetLightNavCardVisible() {
    return isElementDisplayed(STREET_LIGHT_NAV_CARD);
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

  public StreetLightDashboardPage selectStatus(String value) {
    return selectCustomOption(EXTRA_FILTER_SELECT, value);
  }

  public boolean isLoaded() {
    return isElementDisplayed(PAGE_ROOT);
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
}
