package com.iot.selenium.pages;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public abstract class BasePage {
    private static final By ALERT_TOAST = By.cssSelector(".alert-toast");
    private static final By ALERT_TOAST_CLOSE = By.cssSelector(".alert-toast .close-btn");

    protected final WebDriver driver;
    protected final WebDriverWait wait;

    protected BasePage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(15));
    }

    protected WebElement waitForVisible(By locator) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    protected WebElement waitForClickable(By locator) {
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    protected void click(By locator) {
        waitForClickable(locator).click();
    }

    protected void type(By locator, String value) {
        WebElement element = waitForVisible(locator);
        element.clear();
        element.sendKeys(value == null ? "" : value);
    }

    protected String getText(By locator) {
        return waitForVisible(locator).getText().trim();
    }

    /** Dismisses stacked traffic/alert toasts that can block topbar clicks after alert seeding. */
    protected void dismissAlertToastsIfPresent() {
        try {
            new WebDriverWait(driver, Duration.ofSeconds(8))
                    .pollingEvery(Duration.ofMillis(300))
                    .until(driver -> {
                        clickVisibleAlertToastCloseButtons();
                        return !anyAlertToastDisplayed();
                    });
        } catch (TimeoutException ignored) {
            for (int attempt = 0; attempt < 3; attempt++) {
                if (!clickVisibleAlertToastCloseButtons()) {
                    break;
                }
            }
        }
    }

    private boolean clickVisibleAlertToastCloseButtons() {
        boolean clicked = false;
        for (WebElement closeButton : driver.findElements(ALERT_TOAST_CLOSE)) {
            try {
                if (closeButton.isDisplayed()) {
                    ((JavascriptExecutor) driver).executeScript("arguments[0].click();", closeButton);
                    clicked = true;
                }
            } catch (StaleElementReferenceException ignored) {
                // Toast DOM updated between findElements and click; caller re-polls.
            }
        }
        return clicked;
    }

    private boolean anyAlertToastDisplayed() {
        for (WebElement toast : driver.findElements(ALERT_TOAST)) {
            try {
                if (toast.isDisplayed()) {
                    return true;
                }
            } catch (StaleElementReferenceException ignored) {
                // Toast removed from DOM between find and isDisplayed; re-query on next poll.
            }
        }
        return false;
    }

    protected String firstDisplayedText(By locator) {
        try {
            WebElement el = new WebDriverWait(driver, Duration.ofSeconds(15))
                .until(ExpectedConditions.visibilityOfElementLocated(locator));
            return el.getText().trim();
        } catch (TimeoutException e) {
            return "";
        }
    }

    /**
     * Waits for an error element that is created only when an error is present (e.g. {@code .error-message} after HTTP failure).
     */
    protected String waitForErrorText(By locator, int timeoutSeconds) {
        try {
            WebElement el = new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds))
                    .until(ExpectedConditions.visibilityOfElementLocated(locator));
            return el.getText().trim();
        } catch (TimeoutException e) {
            return "";
        }
    }

    /**
     * Waits for the current URL to contain {@code urlFragment}; does not wait for Angular stability.
     * Use after navigation so Selenium does not block on unrelated in-flight HTTP (e.g. home profile refresh).
     */
    public void waitForUrl(String urlFragment, int timeoutSeconds) {
        new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds))
                .until(ExpectedConditions.urlContains(urlFragment));
    }

    public void waitForAngular() {
                wait.until(activeDriver -> {
                        Object result = ((JavascriptExecutor) activeDriver).executeScript("""
                const testabilities = window.getAllAngularTestabilities && window.getAllAngularTestabilities();
                if (testabilities && testabilities.length) {
                  return testabilities.every(testability => testability.isStable());
                }
                if (window.getAngularTestability) {
                  try {
                    return window.getAngularTestability(document.body).isStable();
                  } catch (error) {
                    return document.readyState === 'complete';
                  }
                }
                return document.readyState === 'complete';
                """);
            return Boolean.TRUE.equals(result);
        });
    }
}