package com.iot.selenium.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class SignupPage extends BasePage {
    private static final By EMAIL = By.id("email");
    private static final By FIRST_NAME = By.id("firstName");
    private static final By LAST_NAME = By.id("lastName");
    private static final By PASSWORD = By.id("password");
    private static final By CONFIRM_PASSWORD = By.id("confirmPassword");
    private static final By SUBMIT = By.cssSelector("button[type='submit']");
    private static final By FIELD_ERROR = By.cssSelector(".field-error");
    private static final By API_ERROR = By.cssSelector(".error-message");

    public SignupPage(WebDriver driver) {
        super(driver);
    }

    public SignupPage open(String baseUrl) {
        driver.get(baseUrl + "/signup");
        waitForVisible(EMAIL);
        return this;
    }

    public void fillForm(
            String email,
            String firstName,
            String lastName,
            String password,
            String confirmPassword) {
        type(EMAIL, email);
        type(FIRST_NAME, firstName);
        type(LAST_NAME, lastName);
        type(PASSWORD, password);
        type(CONFIRM_PASSWORD, confirmPassword);
    }

    public void submit() {
        waitForClickable(SUBMIT).click();
    }

    public String getFieldErrorText() {
        return firstDisplayedText(FIELD_ERROR);
    }

    public String getApiErrorText() {
        return waitForErrorText(API_ERROR, 15);
    }

    /**
     * Resolves validation text (immediate in DOM via reactive forms) before reading API errors.
     * When there is no field-level {@code .field-error}, waits up to 15 seconds for HTTP-driven {@code .error-message}.
     */
    public String getErrorText() {
        String field = getFieldErrorText();
        if (!field.isEmpty()) {
            return field;
        }
        return waitForErrorText(API_ERROR, 15);
    }

    public SignupPage enterEmail(String email) {
        type(EMAIL, email);
        return this;
    }

    public SignupPage enterFirstName(String firstName) {
        type(FIRST_NAME, firstName);
        return this;
    }

    public SignupPage enterLastName(String lastName) {
        type(LAST_NAME, lastName);
        return this;
    }

    public SignupPage enterPassword(String password) {
        type(PASSWORD, password);
        return this;
    }

    public SignupPage enterConfirmPassword(String password) {
        type(CONFIRM_PASSWORD, password);
        return this;
    }

    public SignupPage register(String email, String firstName, String lastName, String password) {
        fillForm(email, firstName, lastName, password, password);
        submit();
        return this;
    }

    public String getErrorMessage() {
        return getText(API_ERROR);
    }
}
