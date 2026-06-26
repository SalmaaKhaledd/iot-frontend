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


public class TrafficDashboardPage extends BasePage {
    private static final By PAGE_ROOT = By.cssSelector("[data-testid='traffic-dashboard-page']");
    private static final By BACK_BUTTON = By.cssSelector("[data-testid='back-button']");
    private static final By FILTER_PANEL = By.cssSelector("[data-testid='filter-panel']");
    private static final By LOCATION_SELECT = By.cssSelector("[data-testid='location-select'] [data-testid='custom-select-trigger']");
    private static final By CONGESTION_SELECT = By.cssSelector("[data-testid='congestion-select'] [data-testid='custom-select-trigger']");
    private static final By SORT_SELECT = By.cssSelector("[data-testid='sort-select'] [data-testid='custom-select-trigger']");
    private static final By CUSTOM_SELECT_DROPDOWN = By.cssSelector("[data-testid='custom-select-dropdown']");
    private static final By APPLY_FILTERS = By.cssSelector("[data-testid='apply-filters-btn']");
    private static final By RESET_FILTERS = By.cssSelector("[data-testid='reset-filters-btn']");
    private static final By TRAFFIC_TABLE = By.cssSelector("[data-testid='traffic-table']");
    private static final By TRAFFIC_ROWS = By.cssSelector("[data-testid='traffic-row']");
    private static final By EMPTY_STATE = By.cssSelector("[data-testid='empty-state']");
    private static final By LOADING_STATE = By.cssSelector("[data-testid='loading-state']");
    private static final By ERROR_STATE = By.cssSelector("[data-testid='error-state']");
    private static final By ERROR_STATE_TEXT = By.cssSelector("[data-testid='error-state'] .state-text");
    private static final By NEXT_PAGE = By.cssSelector("[data-testid='next-page-btn']");
    private static final By PREV_PAGE = By.cssSelector("[data-testid='prev-page-btn']");
    private static final By FIRST_PAGE = By.cssSelector("[data-testid='first-page-btn']");
    private static final By LAST_PAGE = By.cssSelector("[data-testid='last-page-btn']");
    private static final By PAGE_SIZE_SELECT = By.cssSelector("[data-testid='page-size-select'] [data-testid='custom-select-trigger']");
    private static final By ALERT_BANNER_STRIP = By.cssSelector("[data-testid='alert-banner-strip']");
    private static final By ALERT_BANNER = By.cssSelector("[data-testid='alert-banner']");
    private static final By ALERT_BANNER_MESSAGE = By.cssSelector("[data-testid='alert-banner'] .alert-banner-message");
    private static final By ALERT_BANNER_CLOSE = By.cssSelector("[data-testid='alert-banner-close']");
    private static final By TRAFFIC_NAV_CARD = By.cssSelector("[data-testid='traffic-nav-card']");
    private static final By FILTER_ERROR = By.cssSelector("[data-testid='filter-panel'] .filter-error");

    private static final String FROM_DATETIME_HOST = "from-datetime";
    private static final String TO_DATETIME_HOST = "to-datetime";

    private final String baseUrl;
    private final String apiBaseUrl;
    private final String trafficDashboardPath;
    private final String homePath;
    private final int explicitWaitSeconds;

    public TrafficDashboardPage(WebDriver driver) {
        super(driver);
        ConfigReader config = new ConfigReader();
        this.baseUrl = config.getBaseUrl();
        this.apiBaseUrl = config.getApiBaseUrl();
        this.trafficDashboardPath = config.getTrafficDashboardPath();
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


    public TrafficDashboardPage open() {
        driver.get(baseUrl + trafficDashboardPath);
        waitForUrl(trafficDashboardPath, explicitWaitSeconds);
        return waitForLoad();
    }
    public boolean isTrafficNavCardVisible() {
        return isElementDisplayed(TRAFFIC_NAV_CARD);
    }

    public boolean isAirQualityNavCardVisible() {
        return driver.findElements(By.cssSelector("[data-testid='air-quality-nav-card']")).stream()
                .anyMatch(e -> e.isDisplayed());
    }

    public boolean isStreetLightsNavCardVisible() {
        return driver.findElements(By.cssSelector("[data-testid='street-lights-nav-card']")).stream()
                .anyMatch(e -> e.isDisplayed());
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

    public TrafficDashboardPage selectLocation(String value) {
        return selectCustomOption(LOCATION_SELECT, value);
    }

    public TrafficDashboardPage selectCongestion(String value) {
        return selectCustomOption(CONGESTION_SELECT, value);
    }

    public TrafficDashboardPage selectSort(String value) {
        return selectCustomOption(SORT_SELECT, value);
    }

    public TrafficDashboardPage selectPageSize(String value) {
        return selectCustomOption(PAGE_SIZE_SELECT, value);
    }

    public TrafficDashboardPage clickApplyFilters() {
        click(APPLY_FILTERS);
        waitForAngular();
        return this;
    }

    public TrafficDashboardPage clickResetFilters() {
        click(RESET_FILTERS);
        waitForAngular();
        return this;
    }

    public boolean isLoaded() {
        return isElementDisplayed(PAGE_ROOT);
    }

    public boolean isTableVisible() {
        try {
            List<WebElement> tables = driver.findElements(TRAFFIC_TABLE);
            return !tables.isEmpty() && tables.get(0).isDisplayed();
        } catch (StaleElementReferenceException e) {
            List<WebElement> tables = driver.findElements(TRAFFIC_TABLE);
            return !tables.isEmpty() && tables.get(0).isDisplayed();
        }
    }

    public int getRowCount() {
        return driver.findElements(TRAFFIC_ROWS).size();
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

    public TrafficDashboardPage waitForLoadingToFinish() {
        new WebDriverWait(driver, Duration.ofSeconds(explicitWaitSeconds))
                .until(ExpectedConditions.invisibilityOfElementLocated(LOADING_STATE));
        return this;
    }

    public TrafficDashboardPage waitForResultsReady() {
        waitForLoadingToFinish();
        waitForAngular();
        return this;
    }

    public boolean isErrorStateVisible() {
        return isElementDisplayed(ERROR_STATE);
    }

    public String getErrorMessage() {
        return firstDisplayedText(ERROR_STATE_TEXT);
    }

    public String waitForErrorMessage() {
        return waitForErrorText(ERROR_STATE_TEXT, explicitWaitSeconds);
    }

    public boolean isPaginationVisible() {
        return isElementDisplayed(NEXT_PAGE) || isElementDisplayed(PREV_PAGE);
    }

    public TrafficDashboardPage clickNextPage() {
        click(NEXT_PAGE);
        return waitForResultsReady();
    }

    public TrafficDashboardPage clickPrevPage() {
        click(PREV_PAGE);
        return waitForResultsReady();
    }

    public TrafficDashboardPage clickFirstPage() {
        click(FIRST_PAGE);
        return waitForResultsReady();
    }

    public TrafficDashboardPage clickLastPage() {
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
                if (banner.isDisplayed()) {
                    count++;
                }
            } catch (StaleElementReferenceException ignored) {
                // Banner strip re-rendered while counting; next poll re-queries the DOM.
            }
        }
        return count;
    }

    public String getAlertBannerMessage() {
        for (WebElement message : driver.findElements(ALERT_BANNER_MESSAGE)) {
            if (message.isDisplayed()) {
                return message.getText().trim();
            }
        }
        return "";
    }

    public List<String> getAlertBannerMessages() {
        List<String> messages = new ArrayList<>();
        for (WebElement message : driver.findElements(ALERT_BANNER_MESSAGE)) {
            if (message.isDisplayed()) {
                messages.add(message.getText().trim());
            }
        }
        return messages;
    }

    public TrafficDashboardPage waitForAlertBanner() {
        waitForVisible(ALERT_BANNER);
        return this;
    }

    public TrafficDashboardPage dismissAlertBanner() {
        if (clickFirstVisibleAlertBannerClose()) {
            waitForAngular();
        }
        return this;
    }


    public TrafficDashboardPage dismissAllAlertBanners() {
        final int maxAttempts = 10;
        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            if (!clickFirstVisibleAlertBannerClose()) {
                break;
            }
            waitForAngular();
        }
        return this;
    }

    private boolean clickFirstVisibleAlertBannerClose() {
        List<WebElement> closeButtons = driver.findElements(ALERT_BANNER_CLOSE);
        for (WebElement closeButton : closeButtons) {
            try {
                if (!closeButton.isDisplayed()) {
                    continue;
                }
                closeButton.click();
                return true;
            } catch (StaleElementReferenceException ignored) {
                // Banner strip re-rendered between findElements and click; try next or re-query.
            }
        }
        return false;
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

    private TrafficDashboardPage selectCustomOption(By triggerLocator, String value) {
        click(triggerLocator);
        waitForVisible(CUSTOM_SELECT_DROPDOWN);
        click(optionByValue(value));
        waitForAngular();
        return this;
    }

    private static By optionByValue(String value) {
        return By.cssSelector("[data-testid='option-" + value + "']");
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
        if (hour12 == 0) {
            hour12 = 12;
        }
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
        if (periodButtons.size() < 2) {
            return;
        }
        WebElement target = pm ? periodButtons.get(1) : periodButtons.get(0);
        if (!target.getAttribute("class").contains("active")) {
            target.click();
        }
    }

    private void closeDateTimePicker() {
        click(By.cssSelector(".page-title"));
    }

    private boolean isElementDisplayed(By locator) {
        List<WebElement> elements = driver.findElements(locator);
        return !elements.isEmpty() && elements.get(0).isDisplayed();
    }

    private boolean isButtonEnabled(By locator) {
        List<WebElement> elements = driver.findElements(locator);
        if (elements.isEmpty()) {
            return false;
        }
        WebElement button = elements.get(0);
        return button.isDisplayed() && button.isEnabled();
    }

    public TrafficDashboardPage clickFilterPanelToggle() {
        click(By.cssSelector("[data-testid='filter-panel'] .filter-header"));
        waitForAngular();
        return this;
    }

    public TrafficDashboardPage waitForFilterPanelExpanded() {
        new WebDriverWait(driver, Duration.ofSeconds(5))
                .until(d -> !isFilterPanelCollapsed());
        return this;
    }

    public TrafficDashboardPage waitForFilterPanelCollapsed() {
        new WebDriverWait(driver, Duration.ofSeconds(5))
                .until(d -> isFilterPanelCollapsed());
        return this;
    }

    public boolean isFilterPanelCollapsed() {
        for (int attempt = 0; attempt < 3; attempt++) {
            try {
                List<WebElement> applyButtons = driver.findElements(APPLY_FILTERS);
                if (applyButtons.isEmpty()) {
                    return true;
                }
                return !applyButtons.get(0).isDisplayed();
            } catch (StaleElementReferenceException e) {
                if (attempt == 2) {
                    throw e;
                }
            }
        }
        return true;
    }

    public String getFirstRowText() {
        List<WebElement> rows = driver.findElements(TRAFFIC_ROWS);
        if (rows.isEmpty()) {
            return "";
        }
        return rows.get(0).getText().trim();
    }

    public String getFirstRowTimestamp() {
        List<WebElement> rows = driver.findElements(TRAFFIC_ROWS);
        if (rows.isEmpty()) {
            return "";
        }
        return timestampTextFromRow(rows.get(0));
    }

    public String getSecondRowTimestamp() {
        List<WebElement> rows = driver.findElements(TRAFFIC_ROWS);
        if (rows.size() < 2) {
            return "";
        }
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
            if (header.isDisplayed()) {
                return true;
            }
        }
        return false;
    }

    public TrafficDashboardPage clickAnalyticsToggle() {
        click(By.cssSelector("[data-testid='analytics-header']"));
        waitForAngular();
        return this;
    }

    public boolean isAnalyticsPanelExpanded() {
        List<WebElement> charts = driver.findElements(By.id("speedChart"));
        for (int i = 0; i < charts.size(); i++) {
            try {
                if (charts.get(i).isDisplayed()) {
                    return true;
                }
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
                if (!text.isEmpty()) {
                    values.add(text);
                }
            }
        }
        return values;
    }

    public boolean areChartsRendered() {
        return !driver.findElements(By.id("speedChart")).isEmpty()
                && !driver.findElements(By.id("densityChart")).isEmpty()
                && !driver.findElements(By.id("donutChart")).isEmpty();
    }
}
