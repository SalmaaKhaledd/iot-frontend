package com.iot.selenium.tests;

import java.time.Duration;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

import com.iot.selenium.config.ConfigReader;
import com.iot.selenium.pages.SigninPage;
import com.iot.selenium.utils.ExcelReader;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;

public abstract class BaseTest {
    protected static final String TEST_DATA_FILE = "testdata/frontend-testing.xlsx";
    private static final ExcelReader EXCEL_READER = new ExcelReader();

    protected WebDriver driver;
    protected ConfigReader configReader;
    protected String baseUrl;

    @BeforeMethod(alwaysRun = true)
    public void setUp() {
        configReader = new ConfigReader();
        baseUrl = configReader.getBaseUrl();
        driver = createDriver(configReader.getBrowser());
        driver.manage().window().maximize();
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(configReader.getImplicitWaitSeconds()));
    }

    @AfterMethod(alwaysRun = true)
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    protected void login(String email, String password) {
        new SigninPage(driver)
                .open(baseUrl)
                .login(email, password)
                .waitForAngular();
    }

    protected Map<String, String> structuredData(Map<String, String> row) {
        return parseKeyValuePairs(row.getOrDefault("Test Data Used", ""));
    }

    protected Object[][] rowsForSheet(String sheetName) {
        return EXCEL_READER.readSheet(TEST_DATA_FILE, sheetName);
    }

    protected Object[][] rowsForSheetWhere(String sheetName, String columnName, String expectedValue) {
        Object[][] allRows = rowsForSheet(sheetName);
        if (allRows.length == 0) {
            return allRows;
        }

        Object[][] filtered = new Object[allRows.length][1];
        int index = 0;
        for (Object[] row : allRows) {
            Map<String, String> rowData = rowData(row);
            if (expectedValue.equalsIgnoreCase(rowData.getOrDefault(columnName, ""))) {
                filtered[index++] = new Object[] { rowData };
            }
        }

        Object[][] result = new Object[index][1];
        System.arraycopy(filtered, 0, result, 0, index);
        return result;
    }

    protected Map<String, String> rowData(Object[] row) {
        Object firstCell = row.length == 0 ? null : row[0];
        if (firstCell instanceof Map<?, ?> map) {
            Map<String, String> rowData = new LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                rowData.put(String.valueOf(entry.getKey()), String.valueOf(entry.getValue()));
            }
            return rowData;
        }
        throw new IllegalStateException("Expected ExcelReader rows to contain a row map.");
    }

    private Map<String, String> parseKeyValuePairs(String rawValue) {
        Map<String, String> values = new LinkedHashMap<>();
        if (rawValue == null || rawValue.isBlank()) {
            return values;
        }

        Arrays.stream(rawValue.split("[;\n]"))
                .map(String::trim)
                .filter(entry -> !entry.isBlank())
                .forEach(entry -> {
                    int separatorIndex = entry.indexOf('=');
                    if (separatorIndex < 0) {
                        return;
                    }
                    String key = entry.substring(0, separatorIndex).trim();
                    String value = entry.substring(separatorIndex + 1).trim();
                    if (!key.isEmpty()) {
                        values.put(key, value);
                    }
                });

        return values;
    }

    private WebDriver createDriver(String browser) {
        String normalizedBrowser = browser == null ? "chrome" : browser.trim().toLowerCase();
        return switch (normalizedBrowser) {
            case "firefox" -> {
                WebDriverManager.firefoxdriver().setup();
                FirefoxOptions options = new FirefoxOptions();
                yield new FirefoxDriver(options);
            }
            case "edge" -> {
                WebDriverManager.edgedriver().setup();
                EdgeOptions options = new EdgeOptions();
                yield new EdgeDriver(options);
            }
            default -> {
                WebDriverManager.chromedriver().setup();
                ChromeOptions options = new ChromeOptions();
                options.addArguments("--remote-allow-origins=*");
                yield new ChromeDriver(options);
            }
        };
    }
}