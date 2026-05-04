package com.iot.selenium.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class SigninPage extends BasePage {
    private static final By EMAIL_INPUT = By.id("email");
    private static final By PASSWORD_INPUT = By.id("password");
    private static final By SIGN_IN_BUTTON = By.cssSelector("button[type='submit']");
    private static final By ERROR_MESSAGE = By.cssSelector(".error-message");

    public SigninPage(WebDriver driver) {
        super(driver);
    }

    public SigninPage open(String baseUrl) {
        driver.get(baseUrl + "/login");
        waitForAngular();
        return this;
    }

    public SigninPage enterEmail(String email) {
        type(EMAIL_INPUT, email);
        return this;
    }

    public SigninPage enterPassword(String password) {
        type(PASSWORD_INPUT, password);
        return this;
    }

    public SigninPage submit() {
        click(SIGN_IN_BUTTON);
        return this;
    }

    public SigninPage login(String email, String password) {
        return enterEmail(email).enterPassword(password).submit();
    }

    public String getErrorMessage() {
        return getText(ERROR_MESSAGE);
    }
}