package com.iot.selenium.pages;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.iot.selenium.config.ConfigReader;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

public class SensorDashboardPage extends BasePage {
    private static final Pattern TOKEN_PATTERN = Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern USER_ID_PATTERN = Pattern.compile("\"userId\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("\"email\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern FIRST_NAME_PATTERN = Pattern.compile("\"firstName\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern LAST_NAME_PATTERN = Pattern.compile("\"lastName\"\\s*:\\s*\"([^\"]+)\"");

    /** Token and {@code iot_user} JSON for {@link com.iot.selenium.tests.BaseTest#restoreAuthenticatedSession()}. */
    public record ApiAuthSession(String token, String userJson) {}

    private final String baseUrl;
    private final String apiBaseUrl;
    private final String homePath;
    private final String apiAuthLoginPath;
    private final String apiSensorsGeneratePath;
    private final String apiSensorsFlushPath;
    private final int explicitWaitSeconds;

    public SensorDashboardPage(WebDriver driver) {
        super(driver);
        ConfigReader config = new ConfigReader();
        this.baseUrl = config.getBaseUrl();
        this.apiBaseUrl = config.getApiBaseUrl();
        this.homePath = config.getHomePath();
        this.apiAuthLoginPath = config.getApiAuthLoginPath();
        this.apiSensorsGeneratePath = config.getApiSensorsGeneratePath();
        this.apiSensorsFlushPath = config.getApiSensorsFlushPath();
        this.explicitWaitSeconds = config.getExplicitWaitSeconds();
    }

    public static String authenticate(String email, String password) throws Exception {
        return loginViaApi(email, password).token();
    }

    public static ApiAuthSession loginViaApi(String email, String password) throws Exception {
        ConfigReader config = new ConfigReader();
        String body = String.format("{\"email\":\"%s\",\"password\":\"%s\"}", email, password);
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(config.getApiBaseUrl() + config.getApiAuthLoginPath()))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new IllegalStateException(
                    "Login failed with status " + response.statusCode() + ": " + response.body());
        }
        String responseBody = response.body();
        Matcher tokenMatcher = TOKEN_PATTERN.matcher(responseBody);
        if (!tokenMatcher.find()) {
            throw new IllegalStateException("Login response did not contain a token.");
        }
        String userJson = String.format(
                "{\"id\":\"%s\",\"firstName\":\"%s\",\"lastName\":\"%s\",\"email\":\"%s\",\"profilePicture\":null}",
                jsonField(USER_ID_PATTERN, responseBody, "userId"),
                jsonField(FIRST_NAME_PATTERN, responseBody, "firstName"),
                jsonField(LAST_NAME_PATTERN, responseBody, "lastName"),
                jsonField(EMAIL_PATTERN, responseBody, "email"));
        return new ApiAuthSession(tokenMatcher.group(1), userJson);
    }

    private static String jsonField(Pattern pattern, String responseBody, String fieldName) {
        Matcher matcher = pattern.matcher(responseBody);
        if (!matcher.find()) {
            throw new IllegalStateException("Login response did not contain " + fieldName + ".");
        }
        return matcher.group(1).replace("\\", "\\\\").replace("\"", "\\\"");
    }

    public static void generateSensors(String bearerToken) throws Exception {
        ConfigReader config = new ConfigReader();
        invokeSensorApi("POST", config.getApiBaseUrl(), config.getApiSensorsGeneratePath(), bearerToken);
    }

    /** Clears all sensor readings via per-type flush endpoints (no unified {@code /api/sensors/flush} on backend). */
    public static void flushSensors(String bearerToken) throws Exception {
        ConfigReader config = new ConfigReader();
        String apiBaseUrl = config.getApiBaseUrl();
        invokeSensorApi("DELETE", apiBaseUrl, "/api/sensors/traffic/flush", bearerToken);
        invokeSensorApi("DELETE", apiBaseUrl, "/api/sensors/air-pollution/flush", bearerToken);
        invokeSensorApi("DELETE", apiBaseUrl, "/api/sensors/street-lights/flush", bearerToken);
    }

    public void navigateToHome() {
        driver.get(baseUrl + homePath);
        waitForUrl(homePath, explicitWaitSeconds);
        waitForAngular();
    }

    public void waitForSectionDataDisplayed(String section) {
        waitForSectionData(section);
    }

    public boolean isSectionDataDisplayed(String section) {
        return switch (section.trim().toLowerCase()) {
            case "traffic" -> isElementDisplayed(sectionLocator(section, ".stats-row"));
            case "air" -> isElementDisplayed(sectionLocator(section, ".pollutants"))
                    || isElementDisplayed(sectionLocator(section, ".aqi-score"));
            case "street" -> isElementDisplayed(sectionLocator(section, ".stats-row"));
            default -> throw new IllegalArgumentException("Unknown section: " + section);
        };
    }

    public void waitForEmptyState(String section, String expectedMessage) {
        By locator = sectionLocator(section, ".loading-state p");
        new WebDriverWait(driver, Duration.ofSeconds(explicitWaitSeconds))
                .until(ExpectedConditions.textToBePresentInElementLocated(locator, expectedMessage));
    }

    public boolean isEmptyStateDisplayed(String section, String expectedMessage) {
        List<WebElement> messages = driver.findElements(sectionLocator(section, ".loading-state p"));
        return messages.stream()
                .anyMatch(el -> el.isDisplayed() && expectedMessage.equals(el.getText().trim()));
    }

    public void clickRefresh(String section) {
        click(sectionLocator(section, "button[aria-label='Refresh']"));
        waitForAngular();
    }

    public void clickViewAlerts(String section) {
        String normalized = section.trim().toLowerCase();
        if ("traffic".equals(normalized)) {
            click(sectionLocator(section, "button[aria-label='View traffic alerts']"));
        } else if ("air".equals(normalized)) {
            click(sectionLocator(section, "button[aria-label='View air quality alerts']"));
        } else {
            throw new IllegalArgumentException("View Alerts automation not enabled for section: " + section);
        }
        waitForAngular();
    }

    public void waitForAlertsModalVisible(String section) {
        waitForVisible(sectionLocator(section, ".modal-backdrop"));
    }

    public boolean isAlertsModalVisible(String section) {
        List<WebElement> backdrops = driver.findElements(sectionLocator(section, ".modal-backdrop"));
        return !backdrops.isEmpty() && backdrops.get(0).isDisplayed();
    }

    public void clickCloseAlerts(String section) {
        click(sectionLocator(section, "button[aria-label='Close alerts']"));
        waitForAngular();
    }

    public void waitForAlertsModalClosed(String section) {
        new WebDriverWait(driver, Duration.ofSeconds(explicitWaitSeconds))
                .until(ExpectedConditions.invisibilityOfElementLocated(sectionLocator(section, ".modal-backdrop")));
    }

    public int getHistoryOptionCount(String section) {
        WebElement select = waitForVisible(sectionHistorySelect(section));
        return new Select(select).getOptions().size();
    }

    public void selectHistoryByIndex(String section, int index) {
        WebElement select = waitForVisible(sectionHistorySelect(section));
        new Select(select).selectByIndex(index);
        waitForAngular();
    }

    public String getFirstStatValueText(String section) {
        return getText(sectionLocator(section, ".stats-row .stat-box:nth-of-type(1) .value"));
    }

    public boolean isSectionAnchorDisplayed(String sectionId) {
        List<WebElement> elements = driver.findElements(By.cssSelector(sectionId));
        return !elements.isEmpty() && elements.get(0).isDisplayed();
    }

    private void waitForSectionData(String section) {
        new WebDriverWait(driver, Duration.ofSeconds(explicitWaitSeconds))
                .until(driver -> isSectionDataDisplayed(section));
    }

    private By sectionHistorySelect(String section) {
        return switch (section.trim().toLowerCase()) {
            case "traffic" -> sectionLocator(section, "select[aria-label='Select traffic reading history']");
            case "air" -> sectionLocator(section, "select[aria-label='Select air reading history']");
            case "street" -> sectionLocator(section, "select[aria-label='Select street light reading history']");
            default -> throw new IllegalArgumentException("Unknown section: " + section);
        };
    }

    private By sectionLocator(String section, String innerCss) {
        return By.cssSelector(sectionRootId(section) + " " + innerCss);
    }

    private String sectionRootId(String section) {
        return switch (section.trim().toLowerCase()) {
            case "traffic" -> "#traffic-sensor";
            case "air" -> "#air-quality-sensor";
            case "street" -> "#street-light-sensor";
            default -> throw new IllegalArgumentException("Unknown section: " + section);
        };
    }

    private boolean isElementDisplayed(By locator) {
        List<WebElement> elements = driver.findElements(locator);
        return !elements.isEmpty() && elements.get(0).isDisplayed();
    }

    private static void invokeSensorApi(String method, String apiBaseUrl, String path, String bearerToken)
            throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(apiBaseUrl + path))
                .header("Authorization", "Bearer " + bearerToken);
        HttpRequest request = "DELETE".equals(method)
                ? builder.DELETE().build()
                : builder.POST(HttpRequest.BodyPublishers.noBody()).build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException(
                    method + " " + path + " failed with status " + response.statusCode() + ": " + response.body());
        }
    }
}
