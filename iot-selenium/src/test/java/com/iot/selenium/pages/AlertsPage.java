package com.iot.selenium.pages;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.iot.selenium.config.ConfigReader;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class AlertsPage extends BasePage {
    private static final Pattern ALERT_ID_PATTERN = Pattern.compile("\"id\"\\s*:\\s*\"([^\"]+)\"");

    private static final By NOTIFICATIONS_BELL = By.cssSelector("button[aria-label='Notifications']");
    private static final By NOTIFY_BADGE = By.cssSelector(".notify-badge");
    private static final By NOTIFICATION_PANEL = By.cssSelector(".notification-panel");
    private static final By PANEL_TITLE = By.cssSelector(".notification-panel .panel-header h3");
    private static final By PANEL_CLOSE = By.cssSelector("button.close-btn[aria-label='Close notifications']");
    private static final By EMPTY_STATE = By.cssSelector(".notification-panel .empty-state");
    private static final By EMPTY_STATE_TEXT = By.cssSelector(".notification-panel .empty-state p");
    private static final By PANEL_ALERT_CARDS = By.cssSelector(".notification-panel .panel-body .alert-card");
    private static final By ALERT_TOAST = By.cssSelector(".alert-toast");
    private static final By ALERT_TOAST_CLOSE = By.cssSelector(".alert-toast .close-btn");
    private static final String LOCAL_STORAGE_TOKEN_KEY = "iot_auth_token";
    private static final String SETTINGS_FLUSH_PATH = "/api/settings/flush";
    private static final String ALERTS_FLUSH_PATH = "/api/alerts/flush";

    private final String baseUrl;
    private final String apiBaseUrl;
    private final String homePath;
    private final String apiAlertsPath;
    private final int explicitWaitSeconds;

    public AlertsPage(WebDriver driver) {
        super(driver);
        ConfigReader config = new ConfigReader();
        this.baseUrl = config.getBaseUrl();
        this.apiBaseUrl = config.getApiBaseUrl();
        this.homePath = config.getHomePath();
        this.apiAlertsPath = config.getApiAlertsPath();
        this.explicitWaitSeconds = config.getExplicitWaitSeconds();
    }

    public void navigateTo(String route) {
        driver.get(baseUrl + route);
        waitForUrl(route, explicitWaitSeconds);
        waitForAngular();
        dismissAlertToastIfPresent();
    }

    public void navigateToHome() {
        navigateTo(homePath);
    }

    public void clickNotificationsBell() {
        dismissAlertToastIfPresent();
        WebElement bell = waitForVisible(NOTIFICATIONS_BELL);
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", bell);
        waitForAngular();
    }

    public void dismissAlertToastIfPresent() {
        try {
            new WebDriverWait(driver, Duration.ofSeconds(10))
                    .until(ExpectedConditions.invisibilityOfElementLocated(ALERT_TOAST));
            return;
        } catch (TimeoutException ignored) {
            // Toast may still be visible — try close button
        }
        List<WebElement> closeButtons = driver.findElements(ALERT_TOAST_CLOSE);
        if (!closeButtons.isEmpty() && closeButtons.get(0).isDisplayed()) {
            closeButtons.get(0).click();
            try {
                new WebDriverWait(driver, Duration.ofSeconds(5))
                        .until(ExpectedConditions.invisibilityOfElementLocated(ALERT_TOAST));
            } catch (TimeoutException ignored) {
                // Toast auto-dismisses after ~5s; bell click uses JS if still overlapping
            }
        }
    }

    public void waitForPanelVisible() {
        waitForVisible(NOTIFICATION_PANEL);
    }

    public boolean isPanelVisible() {
        List<WebElement> panels = driver.findElements(NOTIFICATION_PANEL);
        return !panels.isEmpty() && panels.get(0).isDisplayed();
    }

    public String getPanelTitleText() {
        return getText(PANEL_TITLE);
    }

    public void clickClosePanel() {
        dismissAlertToastIfPresent();
        WebElement closeButton = waitForVisible(PANEL_CLOSE);
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", closeButton);
        waitForAngular();
    }

    public void waitForPanelClosed() {
        new WebDriverWait(driver, Duration.ofSeconds(explicitWaitSeconds))
                .until(ExpectedConditions.invisibilityOfElementLocated(NOTIFICATION_PANEL));
    }

    public boolean isEmptyStateDisplayed() {
        List<WebElement> elements = driver.findElements(EMPTY_STATE);
        return !elements.isEmpty() && elements.get(0).isDisplayed();
    }

    public String getEmptyStateText() {
        return getText(EMPTY_STATE_TEXT);
    }

    public boolean isBadgeVisible() {
        List<WebElement> badges = driver.findElements(NOTIFY_BADGE);
        return !badges.isEmpty() && badges.get(0).isDisplayed();
    }

    public void waitForBadgeVisible(boolean expected, int timeoutSeconds) {
        new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds))
                .pollingEvery(Duration.ofMillis(500))
                .until(d -> isBadgeVisible() == expected);
    }

    public int getPanelAlertCardCount() {
        return (int) driver.findElements(PANEL_ALERT_CARDS).stream()
                .filter(WebElement::isDisplayed)
                .count();
    }

    public void clickFirstPanelAlertCard() {
        waitForClickable(PANEL_ALERT_CARDS).click();
        waitForAngular();
    }

    public boolean hasPanelAlertForSensorType(String sensorType) {
        String normalized = sensorType.trim().toLowerCase();
        List<WebElement> badges = driver.findElements(
                By.cssSelector(".notification-panel .alert-card .type-badge.type-" + normalized));
        return badges.stream().anyMatch(WebElement::isDisplayed);
    }

    public void clickPanelAlertCardBySensorType(String sensorType) {
        String normalized = sensorType.trim().toLowerCase();
        By typeBadge = By.cssSelector(".notification-panel .alert-card .type-badge.type-" + normalized);
        WebElement badge = waitForVisible(typeBadge);
        WebElement card = badge.findElement(By.xpath("./ancestor::*[contains(@class,'alert-card')][1]"));
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", card);
        waitForAngular();
    }

    public void waitForSensorModalVisible(String sensorType) {
        waitForVisible(sectionLocator(sensorType, ".modal-backdrop"));
    }

    public boolean isSensorModalVisible(String sensorType) {
        List<WebElement> backdrops = driver.findElements(sectionLocator(sensorType, ".modal-backdrop"));
        return !backdrops.isEmpty() && backdrops.get(0).isDisplayed();
    }

    public int getSensorModalAlertCardCount(String section) {
        return driver.findElements(sectionLocator(section, "app-traffic-alerts .alert-card, "
                        + "app-air-quality-alerts .alert-card, "
                        + "app-street-light-alerts .alert-card"))
                .size();
    }

    public void clickDeleteFirstAlertInModal(String section) {
        click(sectionLocator(section, "button[aria-label='Delete alert']"));
        waitForAngular();
    }

    public void waitForSensorModalAlertCount(String section, int expectedCount) {
        new WebDriverWait(driver, Duration.ofSeconds(explicitWaitSeconds))
                .until(d -> getSensorModalAlertCardCount(section) == expectedCount);
    }

    public static void flushSettingsPublic() throws Exception {
        invokePublicDelete(SETTINGS_FLUSH_PATH);
    }

    public static void flushAlertsPublic() throws Exception {
        invokePublicDelete(ALERTS_FLUSH_PATH);
    }

    public static void generateSensorsPublic() throws Exception {
        ConfigReader config = new ConfigReader();
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(config.getApiBaseUrl() + config.getApiSensorsGeneratePath()))
                .POST(HttpRequest.BodyPublishers.noBody())
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException(
                    "POST " + config.getApiSensorsGeneratePath()
                            + " failed with status " + response.statusCode() + ": " + response.body());
        }
    }

    /** Seeds a low TRAFFIC_DENSITY ABOVE threshold for the authenticated user (reliable vs UI save). */
    public static void seedTrafficDensityAboveThreshold(String bearerToken) throws Exception {
        ConfigReader config = new ConfigReader();
        String body =
                "[{\"type\":\"TRAFFIC\",\"metric\":\"TRAFFIC_DENSITY\",\"thresholdValue\":1,\"alertType\":\"ABOVE\"}]";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(config.getApiBaseUrl() + "/api/settings"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + bearerToken)
                .PUT(HttpRequest.BodyPublishers.ofString(body))
                .build();
        HttpResponse<String> response =
                HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException(
                    "PUT /api/settings failed with status " + response.statusCode() + ": " + response.body());
        }
    }

    public String getAuthTokenFromLocalStorage() {
        Object token = ((JavascriptExecutor) driver).executeScript(
                "return window.localStorage.getItem('" + LOCAL_STORAGE_TOKEN_KEY + "');");
        if (token == null || String.valueOf(token).isBlank()) {
            throw new IllegalStateException(
                    LOCAL_STORAGE_TOKEN_KEY + " not found in localStorage after login.");
        }
        return String.valueOf(token);
    }

    public static List<String> pollAlertIdsUntilMinCount(
            String bearerToken, int minCount, long timeoutMs, long intervalMs) throws Exception {
        long deadline = System.currentTimeMillis() + timeoutMs;
        List<String> ids = List.of();
        while (System.currentTimeMillis() < deadline) {
            ids = fetchAlertIds(bearerToken);
            if (ids.size() >= minCount) {
                return ids;
            }
            Thread.sleep(intervalMs);
        }
        return ids;
    }

    public static List<String> fetchAlertIds(String bearerToken) throws Exception {
        ConfigReader config = new ConfigReader();
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(config.getApiBaseUrl() + config.getApiAlertsPath()))
                .header("Authorization", "Bearer " + bearerToken)
                .GET()
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new IllegalStateException(
                    "GET alerts failed with status " + response.statusCode() + ": " + response.body());
        }
        List<String> ids = new ArrayList<>();
        Matcher matcher = ALERT_ID_PATTERN.matcher(response.body());
        while (matcher.find()) {
            ids.add(matcher.group(1));
        }
        return ids;
    }

    public static void deleteAlert(String bearerToken, String alertId) throws Exception {
        ConfigReader config = new ConfigReader();
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(config.getApiBaseUrl() + config.getApiAlertsPath() + "/" + alertId))
                .header("Authorization", "Bearer " + bearerToken)
                .DELETE()
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException(
                    "DELETE alert failed with status " + response.statusCode() + ": " + response.body());
        }
    }

    public static void deleteAllAlerts(String bearerToken) throws Exception {
        for (String alertId : fetchAlertIds(bearerToken)) {
            deleteAlert(bearerToken, alertId);
        }
    }

    private By sectionLocator(String sensorType, String innerCss) {
        return By.cssSelector(sectionRootId(sensorType) + " " + innerCss);
    }

    private String sectionRootId(String sensorType) {
        return switch (sensorType.trim().toLowerCase()) {
            case "traffic" -> "#traffic-sensor";
            case "air-quality", "air" -> "#air-quality-sensor";
            case "street-light", "street" -> "#street-light-sensor";
            default -> throw new IllegalArgumentException("Unknown sensor type: " + sensorType);
        };
    }

    private static void invokePublicDelete(String path) throws Exception {
        ConfigReader config = new ConfigReader();
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(config.getApiBaseUrl() + path))
                .DELETE()
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException(
                    "DELETE " + path + " failed with status " + response.statusCode() + ": " + response.body());
        }
    }
}
