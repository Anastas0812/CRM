export class Modal {
  constructor(crm) {
    this.crm = crm;
    this.modalOverlay = document.getElementById("modalOverlay");
    this.newGoodBtn = document.querySelector(".btn-add-good");
    this.cancelBtn = document.querySelector(".btn-cancel");
    this.saveBtn = document.querySelector(".btn-save");
    this.productNameInput = document.getElementById("productName");
    this.productPriceInput = document.getElementById("productPrice");

    this.initEvents();
  }

  initEvents() {
    this.newGoodBtn.addEventListener("click", () => this.openForAdd());
    this.cancelBtn.addEventListener("click", () => this.close());
    this.saveBtn.addEventListener("click", () => this.save());

    this.modalOverlay.addEventListener("click", (e) => {
      if (e.target === this.modalOverlay) this.close();
    });
  }

  openForAdd() {
    this.clearForm();
    this.clearErrors();
    this.crm.currentEditId = null;
    this.modalOverlay.classList.add("active");
    this.productNameInput.focus();
  }

  openForEdit(id) {
    const product = this.crm.getProduct(id);
    if (!product) return;

    this.clearForm();
    this.clearErrors();
    this.crm.currentEditId = id;

    // Заполняем форму
    this.productNameInput.value = product.name;
    this.productPriceInput.value = product.price;

    this.modalOverlay.classList.add("active");
    this.productNameInput.focus();
  }

  close() {
    this.modalOverlay.classList.remove("active");
    this.clearForm();
    this.clearErrors();
  }

  save() {
    const name = this.productNameInput.value.trim();
    const priceStr = this.productPriceInput.value.trim();

    this.clearErrors();
    let isValid = true;

    // Валидация
    if (!name) {
      this.showError(this.productNameInput, "🔺 Введите название товара");
      isValid = false;
    }

    if (!priceStr) {
      this.showError(this.productPriceInput, "🔺 Введите стоимость товара");
      isValid = false;
    } else {
      const price = Number(priceStr);
      if (isNaN(price)) {
        this.showError(this.productPriceInput, "Стоимость должна быть числом");
        isValid = false;
      } else if (price <= 0) {
        this.showError(
          this.productPriceInput,
          "Стоимость должна быть больше 0",
        );
        isValid = false;
      }
    }

    if (!isValid) return;

    const price = Number(priceStr);

    if (this.crm.currentEditId) {
      // Редактирование
      this.crm.updateProduct(this.crm.currentEditId, name, price);
    } else {
      // Добавление
      this.crm.addProduct(name, price);
    }

    this.close();
  }

  showError(inputElement, message) {
    const errorElement = document.createElement("div");
    errorElement.className = "error-message";
    errorElement.textContent = message;
    inputElement.parentNode.append(errorElement);
    inputElement.classList.add("error");
  }

  clearErrors() {
    document.querySelectorAll(".error-message").forEach((el) => el.remove());
    this.productNameInput.classList.remove("error");
    this.productPriceInput.classList.remove("error");
  }

  clearForm() {
    this.productNameInput.value = "";
    this.productPriceInput.value = "";
  }
}
