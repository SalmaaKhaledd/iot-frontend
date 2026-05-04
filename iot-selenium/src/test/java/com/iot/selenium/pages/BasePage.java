package com.iot.selenium.pages;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public abstract class BasePage {
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
        waitForAngular();
    }

    protected void type(By locator, String value) {
        WebElement element = waitForVisible(locator);
        element.clear();
        element.sendKeys(value == null ? "" : value);
    }

    protected String getText(By locator) {
        return waitForVisible(locator).getText().trim();
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