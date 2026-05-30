package com.iot.selenium.utils;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;

public class ExcelReader {
    private final DataFormatter dataFormatter = new DataFormatter();

    public Object[][] readSheet(String resourcePath, String sheetName) {
        try (InputStream inputStream = getResourceAsStream(resourcePath);
             Workbook workbook = WorkbookFactory.create(inputStream)) {
            Sheet sheet = workbook.getSheet(sheetName);
            if (sheet == null) {
                throw new IllegalStateException("Sheet '" + sheetName + "' was not found in " + resourcePath + ".");
            }

            Row headerRow = sheet.getRow(sheet.getFirstRowNum());
            if (headerRow == null) {
                return new Object[0][0];
            }

            List<String> headers = new ArrayList<>();
            headerRow.forEach(cell -> headers.add(dataFormatter.formatCellValue(cell).trim()));

            List<Object[]> rows = new ArrayList<>();
            for (int rowIndex = sheet.getFirstRowNum() + 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null || isBlankRow(row)) {
                    continue;
                }

                Map<String, String> rowData = new LinkedHashMap<>();
                for (int cellIndex = 0; cellIndex < headers.size(); cellIndex++) {
                    String header = headers.get(cellIndex);
                    if (header.isEmpty()) {
                        continue;
                    }
                    String value = dataFormatter.formatCellValue(row.getCell(cellIndex)).trim();
                    rowData.put(header, value);
                }
                rows.add(new Object[] { rowData });
            }

            return rows.toArray(Object[][]::new);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to read test data from " + resourcePath + ".", exception);
        }
    }

    private InputStream getResourceAsStream(String resourcePath) {
        String normalizedPath = resourcePath.startsWith("/") ? resourcePath.substring(1) : resourcePath;
        InputStream inputStream = getClass().getClassLoader().getResourceAsStream(normalizedPath);
        if (inputStream == null) {
            throw new IllegalStateException("Could not find test data file on the classpath: " + resourcePath);
        }
        return inputStream;
    }

    private boolean isBlankRow(Row row) {
        return !row.cellIterator().hasNext();
    }
}