package com.iot.selenium.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class UserProfilePage extends BasePage {
    private static final By PROFILE_TITLE = By.cssSelector(".profile-card h1");
    private static final By PROFILE_EMAIL = By.cssSelector(".profile-card .email");
    private static final By BACK_BUTTON = By.cssSelector(".back-button");
    private static final By CHANGE_PASSWORD_BUTTON = By.cssSelector(".change-password-btn");

    public UserProfilePage(WebDriver driver) {
        super(driver);
    }

    public String getFullName() {
        return getText(PROFILE_TITLE);
    }

    public String getEmail() {
        return getText(PROFILE_EMAIL);
    }

    public String getFirstName() {
        return getFieldValue("First name");
    }

    public String getLastName() {
        return getFieldValue("Last name");
    }

    public void goBackToDashboard() {
        click(BACK_BUTTON);
    }

    public boolean isChangePasswordVisible() {
        return !driver.findElements(CHANGE_PASSWORD_BUTTON).isEmpty();
    }

    private String getFieldValue(String label) {
        By locator = By.xpath("//div[contains(@class,'field-row')][.//span[normalize-space()='" + label + "']]//span[contains(@class,'value')]");
        return getText(locator);
    }
}