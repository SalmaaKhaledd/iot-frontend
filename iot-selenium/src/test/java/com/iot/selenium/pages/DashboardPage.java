package com.iot.selenium.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class DashboardPage extends BasePage {
    private static final By GREETING_TITLE = By.cssSelector(".hero h1");
    private static final By REFRESH_NOTICE = By.cssSelector(".refresh-notice");
    private static final By PROFILE_BUTTON = By.cssSelector(".avatar-button");

    public DashboardPage(WebDriver driver) {
        super(driver);
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
        click(PROFILE_BUTTON);
        return new UserProfilePage(driver);
    }
}