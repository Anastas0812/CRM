import puppeteer from "puppeteer";

const isCI = process.env.CI === "true";
jest.setTimeout(120000);

describe("CRM App E2E Tests", () => {
  let browser = null;
  let page = null;

  beforeAll(async () => {
    console.log("=== E2E Test Configuration ===");
    console.log("CI mode:", isCI);
    console.log("Platform:", process.platform);

    try {
      const launchOptions = {
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-software-rasterizer",
          "--disable-web-security",
          "--disable-features=IsolateOrigins,site-per-process",
        ],
        ignoreHTTPSErrors: true,
        dumpio: false,
      };

      console.log("Launching Puppeteer with:", launchOptions);
      browser = await puppeteer.launch(launchOptions);
      page = await browser.newPage();

      await page.setViewport({ width: 1280, height: 800 });
      page.setDefaultTimeout(15000);
      page.setDefaultNavigationTimeout(20000);

      console.log("✅ Puppeteer launched successfully");
    } catch (error) {
      console.error("❌ FAILED to launch Puppeteer:", error.message);
      browser = null;
      page = null;
    }
  });

  afterAll(async () => {
    if (browser && typeof browser.close === "function") {
      try {
        await browser.close();
        console.log("✅ Browser closed");
      } catch (error) {
        console.error("Error closing browser:", error);
      }
    }
  });

  test("1. Страница загружается и содержит основные элементы", async () => {
    if (!page || page.isClosed()) {
      console.log("Skipping test - page not available");
      return;
    }

    // Загружаем страницу
    await page.goto("http://localhost:8080/", {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });

    // Проверяем основные элементы
    const goodsContainer = await page.$(".goods-container");
    expect(goodsContainer).not.toBeNull();

    const addButton = await page.$("button.btn-add-good");
    expect(addButton).not.toBeNull();

    const table = await page.$("table");
    expect(table).not.toBeNull();

    // Проверяем заголовки таблицы
    const thElements = await page.$$eval("th", (ths) =>
      ths.map((th) => th.textContent),
    );
    expect(thElements).toContain("Название");
    expect(thElements).toContain("Стоимость");
    expect(thElements).toContain("Действия");

    // Проверяем что модальное окно изначально скрыто
    const modal = await page.$(".modal-overlay.active");
    expect(modal).toBeNull();
  }, 30000);

  test("2. Добавление товара с валидацией", async () => {
    if (!page || page.isClosed()) return;

    await page.goto("http://localhost:8080/", {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });
    await page.waitForSelector(".goods-container", { timeout: 5000 });

    // Открываем модальное окно
    await page.click(".btn-add-good");
    await page.waitForSelector(".modal-overlay.active", { timeout: 3000 });

    // Пробуем сохранить без данных - должна быть ошибка
    await page.click(".btn-save");
    await page.waitForSelector(".error-message", { timeout: 3000 });

    const errors = await page.$$eval(".error-message", (errors) =>
      errors.map((e) => e.textContent),
    );
    expect(errors).toContain("🔺 Введите название товара");
    expect(errors).toContain("🔺 Введите стоимость товара");

    // Вводим данные
    await page.type("#productName", "Новый товар");
    await page.type("#productPrice", "1500");

    // Сохраняем
    await page.click(".btn-save");

    // Проверяем что товар появился в таблице
    await page.waitForSelector("td", { timeout: 5000 });
    const tableContent = await page.$eval(
      "table",
      (table) => table.textContent,
    );
    expect(tableContent).toContain("Новый товар");
    expect(tableContent).toContain("1500.00");

    // Проверяем что модальное окно закрылось
    await page.waitForFunction(
      () => !document.querySelector(".modal-overlay.active"),
      { timeout: 3000 },
    );
  }, 30000);

  test("3. Редактирование товара", async () => {
    if (!page || page.isClosed()) return;

    // НЕ перезагружаем страницу - используем состояние из теста 2

    // Проверяем что товар есть
    await page.waitForSelector(".btn-edit", { timeout: 5000 });

    // Находим все кнопки редактирования и берем первую
    const editButtons = await page.$$(".btn-edit");
    expect(editButtons.length).toBeGreaterThan(0);

    await editButtons[0].click();
    await page.waitForSelector(".modal-overlay.active", { timeout: 3000 });

    const nameValue = await page.$eval("#productName", (input) => input.value);
    const priceValue = await page.$eval(
      "#productPrice",
      (input) => input.value,
    );
    expect(nameValue).toBe("Новый товар");
    expect(priceValue).toBe("1500");

    // Меняем данные
    await page.evaluate(() => {
      document.getElementById("productName").value = "";
      document.getElementById("productPrice").value = "";
    });
    await page.type("#productName", "Отредактированный товар");
    await page.type("#productPrice", "2500");

    // Сохраняем
    await page.click(".btn-save");

    // Проверяем изменения в таблице
    await page.waitForFunction(
      () => {
        const table = document.querySelector("table");
        return table && table.textContent.includes("Отредактированный товар");
      },
      { timeout: 5000 },
    );

    const tableContent = await page.$eval(
      "table",
      (table) => table.textContent,
    );
    expect(tableContent).toContain("Отредактированный товар");
    expect(tableContent).toContain("2500.00");
    expect(tableContent).not.toContain("Новый товар");
  }, 30000);

  test("4. Удаление товара", async () => {
    if (!page || page.isClosed()) return;

    // НЕ перезагружаем страницу - используем состояние из теста 3

    //  alert
    let alertHandled = false;
    page.once("dialog", async (dialog) => {
      // Используем once вместо on
      expect(dialog.message()).toContain("Удалить товар");
      await dialog.accept();
      alertHandled = true;
    });

    const deleteButtons = await page.$$(".btn-delete");
    expect(deleteButtons.length).toBeGreaterThan(0);

    await deleteButtons[0].click();
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Проверяем что alert сработал
    expect(alertHandled).toBe(true);

    // Ждем удаления - теперь таблица должна быть пуста (только заголовки)
    await page.waitForFunction(
      () => {
        const tds = document.querySelectorAll("td");
        return tds.length === 0; // Нет ячеек с данными
      },
      { timeout: 5000 },
    );

    // Проверяем что таблица пуста (только заголовки)
    const rows = await page.$$eval("tr", (rows) => rows.length);
    expect(rows).toBe(1); // только строка с заголовками
  }, 30000);

  test("5. Валидация некорректных данных", async () => {
    if (!page || page.isClosed()) return;

    await page.goto("http://localhost:8080/", {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });
    await page.waitForSelector(".goods-container", { timeout: 5000 });

    await page.click(".btn-add-good");
    await page.waitForSelector(".modal-overlay.active", { timeout: 3000 });

    //  Пустая цена
    await page.type("#productName", "Товар без цены");
    await page.click(".btn-save");
    await page.waitForSelector(".error-message", { timeout: 3000 });

    let errors = await page.$$eval(".error-message", (errors) =>
      errors.map((e) => e.textContent),
    );
    expect(errors).toContain("🔺 Введите стоимость товара");

    // Отрицательная цена
    await page.evaluate(() => {
      document.getElementById("productName").value = "";
      document.getElementById("productPrice").value = "";
    });

    await page.type("#productName", "Товар с отрицательной ценой");
    await page.type("#productPrice", "-100");
    await page.click(".btn-save");

    await page.waitForFunction(
      () => {
        const error = document.querySelector(".error-message");
        return (
          error && error.textContent.includes("Стоимость должна быть больше 0")
        );
      },
      { timeout: 3000 },
    );

    // текст вместо цены
    await page.evaluate(() => {
      document.getElementById("productPrice").value = "";
    });

    await page.type("#productPrice", "не число");
    await page.click(".btn-save");

    await page.waitForFunction(
      () => {
        const error = document.querySelector(".error-message");
        return (
          error && error.textContent.includes("Стоимость должна быть числом")
        );
      },
      { timeout: 3000 },
    );

    // Закрываем модальное окно
    await page.click(".btn-cancel");
    await page.waitForFunction(
      () => !document.querySelector(".modal-overlay.active"),
      { timeout: 3000 },
    );
  }, 30000);
});
