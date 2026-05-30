package com.iot.selenium.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class SigninPage extends BasePage {
    private static final By EMAIL_INPUT = By.id("email");
    private static final By PASSWORD_INPUT = By.id("password");
    private static final By SIGN_IN_BUTTON = By.cssSelector("button[type='submit']");
    private static final By FIELD_ERROR = By.cssSelector(".field-error");
    private static final By ERROR_MESSAGE = By.cssSelector(".error-message");

    public SigninPage(WebDriver driver) {
        super(driver);
    }

    public SigninPage open(String baseUrl) {
        driver.get(baseUrl + "/login");
        waitForVisible(EMAIL_INPUT);
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

    public String getFieldErrorText() {
        return firstDisplayedText(FIELD_ERROR);
    }

    public String getApiErrorText() {
        return waitForErrorText(ERROR_MESSAGE, 15);
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
        return waitForErrorText(ERROR_MESSAGE, 15);
    }
}
