package com.iot.selenium.pages;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.NoAlertPresentException;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class SettingsPage extends BasePage {
    private static final String BASE_URL = "http://localhost:4200";
    private static final String API_BASE_URL = "http://localhost:8080";

    private static final By PAGE_HEADING = By.cssSelector(".settings-page .page-header h1");
    private static final By BACK_BUTTON = By.cssSelector(".settings-page button.back-button");
    private static final By UNSAVED_BADGE = By.cssSelector(".settings-page span.unsaved-badge");
    private static final By SAVE_BUTTON = By.cssSelector(".settings-page button.save-btn");
    private static final By SUCCESS_TOAST = By.cssSelector(".settings-page div.toast-success");
    private static final By TOPBAR_SETTINGS = By.cssSelector("button.icon-button[aria-label='Settings']");

    private static final By THRESHOLDS_TAB = By.xpath(
            "//aside[contains(@class,'tab-rail')]//button[contains(@class,'tab-button')]//strong[text()='Thresholds']");
    private static final By CONFIGURATION_TAB = By.xpath(
            "//aside[contains(@class,'tab-rail')]//button[contains(@class,'tab-button')]//strong[text()='Configuration']");

    private static final String THRESHOLDS_PANEL = "app-settings-thresholds-panel";
    private static final String CONFIG_PANEL = "app-settings-configuration-panel";

    public SettingsPage(WebDriver driver) {
        super(driver);
    }

    public void navigateToSettings() {
        driver.get(BASE_URL + "/settings");
        waitForUrl("/settings", 15);
        waitForAngular();
    }

    public void clickBackToHome() {
        click(BACK_BUTTON);
        waitForUrl("/home", 15);
    }

    public void clickThresholdsTab() {
        clickTab(THRESHOLDS_TAB);
    }

    public void clickConfigurationTab() {
        clickTab(CONFIGURATION_TAB);
    }

    public boolean isThresholdsTabActive() {
        return isTabActive(THRESHOLDS_TAB);
    }

    public boolean isConfigurationTabActive() {
        return isTabActive(CONFIGURATION_TAB);
    }

    public boolean isUnsavedBadgeVisible() {
        List<WebElement> elements = driver.findElements(UNSAVED_BADGE);
        return !elements.isEmpty() && elements.get(0).isDisplayed();
    }

    public boolean isSaveButtonDisabled() {
        WebElement saveButton = waitForVisible(SAVE_BUTTON);
        String disabled = saveButton.getAttribute("disabled");
        return disabled != null && !disabled.isBlank();
    }

    public void clickSaveChanges() {
        waitForClickable(SAVE_BUTTON).click();
        // Do NOT call waitForAngular() here — a browser alert may fire immediately
        // and block JS execution. Callers handle their own post-click waits.
    }

    public void waitBetweenTests() throws InterruptedException {
        Thread.sleep(6000);
    }

    public boolean isValidationAlertPresent() {
        try {
            driver.switchTo().alert();
            return true;
        } catch (NoAlertPresentException e) {
            return false;
        }
    }

    public void dismissValidationAlert() {
        try {
            driver.switchTo().alert().dismiss();
        } catch (NoAlertPresentException ignored) {
        }
    }

    public String getValidationAlertText() {
        return driver.switchTo().alert().getText().trim();
    }

    public void waitForValidationAlert() {
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.alertIsPresent());
    }

    public boolean isSuccessToastVisible() {
        List<WebElement> elements = driver.findElements(SUCCESS_TOAST);
        return !elements.isEmpty() && elements.get(0).isDisplayed();
    }

    public void waitForSuccessToastVisible() {
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.visibilityOfElementLocated(SUCCESS_TOAST));
    }

    public void waitForSuccessToastGone() {
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.invisibilityOfElementLocated(SUCCESS_TOAST));
    }

    public String getSuccessToastText() {
        return getText(SUCCESS_TOAST);
    }

    public boolean isSettingsHeadingVisible() {
        List<WebElement> elements = driver.findElements(PAGE_HEADING);
        return !elements.isEmpty() && elements.get(0).isDisplayed();
    }

    public String getSettingsHeadingText() {
        return getText(PAGE_HEADING);
    }

    public boolean areSettingsTabButtonsVisible() {
        return !driver.findElements(THRESHOLDS_TAB).isEmpty()
                && !driver.findElements(CONFIGURATION_TAB).isEmpty();
    }

    public void clickTopbarSettings() {
        click(TOPBAR_SETTINGS);
        waitForUrl("/settings", 15);
        waitForAngular();
    }

    public void waitForConfigurationPanel() {
        waitForVisible(By.cssSelector(CONFIG_PANEL));
    }

    public void enterConfigurationInterval(String field, String value) {
        WebElement input = waitForVisible(configurationIntervalInput(field));
        ((JavascriptExecutor) driver).executeScript(
                """
                arguments[0].value = arguments[1];
                arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
                arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
                """,
                input,
                value == null ? "" : value);
        waitForAngular();
    }

    public String getConfigurationIntervalValue(String field) {
        WebElement input = waitForVisible(configurationIntervalInput(field));
        String value = input.getAttribute("value");
        return value == null ? "" : value.trim();
    }

    public boolean isConfigurationErrorTooltipVisible(String field) {
        WebElement shell = configurationInputShell(field);
        List<WebElement> tooltips = shell.findElements(By.cssSelector(".error-tooltip[role='alert']"));
        return !tooltips.isEmpty() && tooltips.get(0).isDisplayed();
    }

    public String getConfigurationErrorTooltipText(String field) {
        WebElement shell = configurationInputShell(field);
        List<WebElement> tooltips = shell.findElements(By.cssSelector(".error-tooltip[role='alert']"));
        if (tooltips.isEmpty() || !tooltips.get(0).isDisplayed()) {
            return "";
        }
        return tooltips.get(0).getText().trim();
    }

    public void saveIntervalsViaApi(int traffic, int airPollution, int streetLight) throws Exception {
        String token = (String) ((JavascriptExecutor) driver).executeScript(
                "return window.localStorage.getItem('iot_auth_token');");
        if (token == null || token.isBlank()) {
            return;
        }
        HttpClient client = HttpClient.newHttpClient();
        String intervalId = null;
        HttpRequest getRequest = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE_URL + "/api/intervals"))
                .header("Authorization", "Bearer " + token)
                .GET()
                .build();
        HttpResponse<String> getResponse = client.send(getRequest, HttpResponse.BodyHandlers.ofString());
        if (getResponse.statusCode() == 200) {
            String body = getResponse.body();
            int idIndex = body.indexOf("\"id\"");
            if (idIndex >= 0) {
                int start = body.indexOf('"', idIndex + 4) + 1;
                int end = body.indexOf('"', start);
                if (start > 0 && end > start) {
                    intervalId = body.substring(start, end);
                }
            }
        }
        String payload = intervalId == null || intervalId.isBlank()
                ? String.format(
                        "{\"trafficInterval\":%d,\"airPollutionInterval\":%d,\"streetLightInterval\":%d}",
                        traffic,
                        airPollution,
                        streetLight)
                : String.format(
                        "{\"id\":\"%s\",\"trafficInterval\":%d,\"airPollutionInterval\":%d,\"streetLightInterval\":%d}",
                        intervalId,
                        traffic,
                        airPollution,
                        streetLight);
        HttpRequest putRequest = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE_URL + "/api/intervals"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .PUT(HttpRequest.BodyPublishers.ofString(payload))
                .build();
        client.send(putRequest, HttpResponse.BodyHandlers.ofString());
    }

    public void enterThresholdValue(String placeholder, String value) {
        WebElement input = waitForVisible(thresholdInput(placeholder));
        setInputValue(input, value);
    }

    public void enterAboveValue(String placeholder, String value) {
        WebElement input = inputInThresholdRow(placeholder, 0);
        setInputValue(input, value);
    }

    public void enterBelowValue(String placeholder, String value) {
        WebElement input = inputInThresholdRow(placeholder, 1);
        setInputValue(input, value);
    }

    public String getThresholdValue(String placeholder) {
        WebElement input = waitForVisible(thresholdInput(placeholder));
        String value = input.getAttribute("value");
        return value == null ? "" : value.trim();
    }

    public String getPlaceholderText(String placeholder) {
        WebElement input = waitForVisible(thresholdInput(placeholder));
        String text = input.getAttribute("placeholder");
        return text == null ? "" : text.trim();
    }

    public boolean isErrorTooltipVisible(String placeholder) {
        return isErrorTooltipVisible(placeholder, 0);
    }

    public boolean isErrorTooltipVisibleOnBothRows(String placeholder) {
        return isErrorTooltipVisible(placeholder, 0) && isErrorTooltipVisible(placeholder, 1);
    }

    public String getErrorTooltipText(String placeholder) {
        return getErrorTooltipText(placeholder, 0);
    }

    public String getConditionButtonText(String placeholder) {
        return getConditionButtonText(placeholder, 0);
    }

    public String getConditionButtonText(String placeholder, int rowIndex) {
        WebElement button = conditionButtonInRow(placeholder, rowIndex);
        return button.getText().trim();
    }

    public void clickConditionButton(String placeholder) {
        WebElement button = waitUntilClickable(conditionButtonInRow(placeholder, 0));
        button.click();
        waitForAngular();
    }

    public void clickAddThreshold(String placeholder) {
        int before = countThresholdRows(placeholder);
        WebElement addButton = metricCard(placeholder).findElement(By.cssSelector("button.add-threshold-btn"));
        waitUntilClickable(addButton).click();
        waitForAngular();
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(d -> countThresholdRows(placeholder) > before);
    }

    public int countThresholdRows(String placeholder) {
        return metricCard(placeholder).findElements(By.cssSelector(".threshold-row")).size();
    }

    public boolean isAddThresholdButtonVisible(String placeholder) {
        List<WebElement> buttons = metricCard(placeholder).findElements(By.cssSelector("button.add-threshold-btn"));
        return !buttons.isEmpty() && buttons.get(0).isDisplayed();
    }

    /** After flush/reload, wait until the metric has one row and can add another. */
    public void waitForDefaultThresholdState(String placeholder) {
        WebDriverWait shortWait = new WebDriverWait(driver, Duration.ofSeconds(3));
        try {
            shortWait.until(d -> countThresholdRows(placeholder) == 1 && isAddThresholdButtonVisible(placeholder));
        } catch (TimeoutException e) {
            navigateToSettings();
            new WebDriverWait(driver, Duration.ofSeconds(10))
                    .until(d -> countThresholdRows(placeholder) == 1 && isAddThresholdButtonVisible(placeholder));
        }
    }

    public void clickRemoveThreshold(String placeholder) {
        int before = countThresholdRows(placeholder);
        if (before < 1) {
            throw new IllegalStateException("No threshold row to remove for placeholder: " + placeholder);
        }
        clickRemoveThresholdRow(placeholder, before - 1);
        waitForAngular();
        // When removing the only row, the input is gone — cannot poll countThresholdRows.
        if (before > 1) {
            new WebDriverWait(driver, Duration.ofSeconds(10))
                    .until(d -> countThresholdRows(placeholder) < before);
        }
    }

    public void clearLocalStorage() {
        ((JavascriptExecutor) driver).executeScript("window.localStorage.clear();");
    }

    public void flushSettings() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE_URL + "/api/settings/flush"))
                .DELETE()
                .build();
        client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    public void registerUser(String email, String firstName, String lastName, String password) throws Exception {
        String body = String.format(
                "{\"email\":\"%s\",\"firstName\":\"%s\",\"lastName\":\"%s\",\"password\":\"%s\"}",
                email,
                firstName,
                lastName,
                password);
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE_URL + "/api/auth/register"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    public void tryRegisterUser(String email, String firstName, String lastName, String password) throws Exception {
        String body = String.format(
                "{\"email\":\"%s\",\"firstName\":\"%s\",\"lastName\":\"%s\",\"password\":\"%s\"}",
                email,
                firstName,
                lastName,
                password);
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE_URL + "/api/auth/register"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 201 && response.statusCode() != 409) {
            throw new IllegalStateException(
                    "registerUser failed with status: " + response.statusCode() + " body: " + response.body());
        }
    }

    public void deleteUser(String email) throws Exception {
        String body = String.format("{\"email\":\"%s\"}", email);
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE_URL + "/api/user/delete"))
                .header("Content-Type", "application/json")
                .method("DELETE", HttpRequest.BodyPublishers.ofString(body))
                .build();
        client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private void clickTab(By tabLabel) {
        WebElement strong = waitForVisible(tabLabel);
        WebElement tabButton = strong.findElement(By.xpath("./ancestor::button[contains(@class,'tab-button')]"));
        waitUntilClickable(tabButton).click();
        waitForAngular();
    }

    private boolean isTabActive(By tabLabel) {
        List<WebElement> labels = driver.findElements(tabLabel);
        if (labels.isEmpty()) {
            return false;
        }
        WebElement tabButton = labels.get(0).findElement(By.xpath("./ancestor::button[contains(@class,'tab-button')]"));
        return "true".equals(tabButton.getAttribute("aria-selected"));
    }

    private By configurationIntervalInput(String field) {
        return By.cssSelector(CONFIG_PANEL + " #" + configurationIntervalDomId(field));
    }

    private String configurationIntervalDomId(String field) {
        return switch (field.trim().toLowerCase()) {
            case "traffic" -> "trafficReadingInterval";
            case "air" -> "airQualityReadingInterval";
            case "street" -> "streetLightReadingInterval";
            default -> throw new IllegalArgumentException("Unknown configuration field: " + field);
        };
    }

    private WebElement configurationInputShell(String field) {
        WebElement input = waitForVisible(configurationIntervalInput(field));
        return closest(input, ".input-shell");
    }

    private By thresholdInput(String placeholder) {
        return By.cssSelector(THRESHOLDS_PANEL + " input[placeholder='" + placeholder + "']");
    }

    private WebElement metricCard(String placeholder) {
        WebElement input = waitForVisible(thresholdInput(placeholder));
        return closest(input, ".metric-card");
    }

    private WebElement thresholdRow(String placeholder, int rowIndex) {
        List<WebElement> rows = metricCard(placeholder).findElements(By.cssSelector(".threshold-row"));
        if (rowIndex < 0 || rowIndex >= rows.size()) {
            throw new IllegalStateException("Threshold row index " + rowIndex + " is out of range.");
        }
        return rows.get(rowIndex);
    }

    private WebElement inputInThresholdRow(String placeholder, int rowIndex) {
        WebElement row = thresholdRow(placeholder, rowIndex);
        return row.findElement(By.cssSelector("input[type='number']"));
    }

    private WebElement conditionButtonInRow(String placeholder, int rowIndex) {
        return thresholdRow(placeholder, rowIndex).findElement(By.cssSelector("button.condition-btn"));
    }

    private void clickRemoveThresholdRow(String placeholder, int rowIndex) {
        WebElement removeButton = thresholdRow(placeholder, rowIndex)
                .findElement(By.cssSelector("button.remove-btn[aria-label='Remove threshold']"));
        waitUntilClickable(removeButton).click();
        waitForAngular();
    }

    private WebElement waitUntilClickable(WebElement element) {
        return new WebDriverWait(driver, Duration.ofSeconds(15))
                .until(ExpectedConditions.elementToBeClickable(element));
    }

    private boolean isErrorTooltipVisible(String placeholder, int rowIndex) {
        List<WebElement> tooltips = thresholdRow(placeholder, rowIndex).findElements(By.cssSelector(".error-tooltip"));
        return !tooltips.isEmpty() && tooltips.get(0).isDisplayed();
    }

    private String getErrorTooltipText(String placeholder, int rowIndex) {
        List<WebElement> tooltips = thresholdRow(placeholder, rowIndex).findElements(By.cssSelector(".error-tooltip"));
        if (tooltips.isEmpty() || !tooltips.get(0).isDisplayed()) {
            return "";
        }
        return tooltips.get(0).getText().trim();
    }

    private WebElement closest(WebElement element, String selector) {
        return (WebElement) ((JavascriptExecutor) driver).executeScript(
                "return arguments[0].closest(arguments[1]);",
                element,
                selector);
    }

    private void setInputValue(WebElement input, String value) {
        input.clear();
        input.sendKeys(value == null ? "" : value);
        JavascriptExecutor js = (JavascriptExecutor) driver;
        js.executeScript(
                """
                arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
                arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
                """,
                input);
        waitForAngular();
    }
}
