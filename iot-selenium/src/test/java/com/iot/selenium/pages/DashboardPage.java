package com.iot.selenium.pages;

import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class DashboardPage extends BasePage {
    private static final By GREETING_TITLE = By.cssSelector(".hero h1");
    private static final By AVATAR_BUTTON = By.cssSelector(".avatar-button");
    private static final By REFRESH_NOTICE = By.cssSelector(".refresh-notice");

    public DashboardPage(WebDriver driver) {
        super(driver);
    }

    public DashboardPage waitForLoad() {
        waitForVisible(GREETING_TITLE);
        return this;
    }

    public void clickAvatar() {
        click(AVATAR_BUTTON);
    }

    public boolean isLoaded() {
        List<WebElement> elements = driver.findElements(GREETING_TITLE);
        return !elements.isEmpty() && elements.get(0).isDisplayed();
    }

    public String getGreetingText() {
        return getText(GREETING_TITLE);
    }

    public String getRefreshNotice() {
        return driver.findElements(REFRESH_NOTICE).isEmpty() ? "" : getText(REFRESH_NOTICE);
    }

    public boolean hasRefreshNotice() {
        return !driver.findElements(REFRESH_NOTICE).isEmpty();
    }

    public UserProfilePage openProfile() {
        click(AVATAR_BUTTON);
        return new UserProfilePage(driver);
    }
}
