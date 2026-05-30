package com.iot.selenium.pages;

import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class UserProfilePage extends BasePage {
    private static final By FULL_NAME = By.cssSelector(".profile-card h1");
    private static final By EMAIL = By.cssSelector(".profile-card .email");
    private static final By BACK_BUTTON = By.cssSelector(".back-button");
    private static final By CHANGE_PASSWORD = By.cssSelector(".change-password-btn");
    private static final By LOGOUT_BUTTON = By.cssSelector("button.logout-btn");

    public UserProfilePage(WebDriver driver) {
        super(driver);
    }

    public UserProfilePage open(String baseUrl) {
        driver.get(baseUrl + "/profile");
        // don't call waitForAngular — use URL check instead
        // auth guard will redirect to /login if unauthenticated
        // waitForLoad() will wait for .profile-card h1
        return this;
    }

    public UserProfilePage waitForLoad() {
        waitForVisible(FULL_NAME);
        return this;
    }

    public String getFullName() {
        return waitForVisible(FULL_NAME).getText().trim();
    }

    public String getEmail() {
        return waitForVisible(EMAIL).getText().trim();
    }

    public String getFirstName() {
        return getFieldValue("First name");
    }

    public String getLastName() {
        return getFieldValue("Last name");
    }

    public void clickBack() {
        click(BACK_BUTTON);
    }

    public void goBackToDashboard() {
        clickBack();
    }

    public boolean isChangePasswordVisible() {
        List<WebElement> elements = driver.findElements(CHANGE_PASSWORD);
        return !elements.isEmpty() && elements.get(0).isDisplayed();
    }

    public void clickLogout() {
        click(LOGOUT_BUTTON);
    }

    private String getFieldValue(String label) {
        By locator = By.xpath(
                "//div[contains(@class,'field-row')][.//span[normalize-space()='"
                        + label
                        + "']]//span[contains(@class,'value')]");
        return getText(locator);
    }
}
