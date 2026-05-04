package com.iot.selenium.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class SignupPage extends BasePage {
    private static final By EMAIL_INPUT = By.id("email");
    private static final By FIRST_NAME_INPUT = By.id("firstName");
    private static final By LAST_NAME_INPUT = By.id("lastName");
    private static final By PASSWORD_INPUT = By.id("password");
    private static final By CONFIRM_PASSWORD_INPUT = By.id("confirmPassword");
    private static final By CREATE_ACCOUNT_BUTTON = By.cssSelector("button[type='submit']");
    private static final By ERROR_MESSAGE = By.cssSelector(".error-message");

    public SignupPage(WebDriver driver) {
        super(driver);
    }

    public SignupPage open(String baseUrl) {
        driver.get(baseUrl + "/signup");
        waitForAngular();
        return this;
    }

    public SignupPage enterEmail(String email) {
        type(EMAIL_INPUT, email);
        return this;
    }

    public SignupPage enterFirstName(String firstName) {
        type(FIRST_NAME_INPUT, firstName);
        return this;
    }

    public SignupPage enterLastName(String lastName) {
        type(LAST_NAME_INPUT, lastName);
        return this;
    }

    public SignupPage enterPassword(String password) {
        type(PASSWORD_INPUT, password);
        return this;
    }

    public SignupPage enterConfirmPassword(String password) {
        type(CONFIRM_PASSWORD_INPUT, password);
        return this;
    }

    public SignupPage register(String email, String firstName, String lastName, String password) {
        return enterEmail(email)
                .enterFirstName(firstName)
                .enterLastName(lastName)
                .enterPassword(password)
                .enterConfirmPassword(password)
                .submit();
    }

    public SignupPage submit() {
        click(CREATE_ACCOUNT_BUTTON);
        return this;
    }

    public String getErrorMessage() {
        return getText(ERROR_MESSAGE);
    }
}