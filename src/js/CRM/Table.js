export class Table {
  constructor(crm) {
    this.crm = crm;
    this.tableElement = document.querySelector("table");
  }

  render() {
    const rows = this.tableElement.querySelectorAll("tr:not(:first-child)");
    rows.forEach((row) => row.remove());

    this.crm.products.forEach((product) => {
      const row = this.createRow(product);
      this.tableElement.append(row);
    });
  }

  createRow(product) {
    const row = document.createElement("tr");
    row.dataset.id = product.id;

    const nameCell = document.createElement("td");
    nameCell.textContent = product.name;

    const priceCell = document.createElement("td");
    priceCell.textContent = product.price.toFixed(2);
    priceCell.style.textAlign = "right";

    const actionsCell = document.createElement("td");

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.className = "btn-edit";
    editBtn.addEventListener("click", () => {
      this.crm.modal.openForEdit(product.id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "✕";
    deleteBtn.className = "btn-delete";
    deleteBtn.addEventListener("click", () => {
      if (confirm(`Удалить товар "${product.name}"?`)) {
        this.crm.deleteProduct(product.id);
      }
    });

    actionsCell.append(editBtn);
    actionsCell.append(deleteBtn);

    row.append(nameCell);
    row.append(priceCell);
    row.append(actionsCell);

    return row;
  }
}
