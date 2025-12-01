import { Table } from "./Table.js";
import { Modal } from "./Modal.js";

export class CRM {
  constructor() {
    this.products = [];
    this.currentEditId = null;
    this.modal = null;
    this.table = null;

    this.init();
  }

  init() {
    this.table = new Table(this);
    this.modal = new Modal(this);

    this.table.render();
  }

  addProduct(name, price) {
    const product = {
      id: Date.now(),
      name: name.trim(),
      price: Number(price),
    };
    this.products.push(product);
    this.table.render();
  }

  updateProduct(id, name, price) {
    const product = this.products.find((p) => p.id === id);
    if (product) {
      product.name = name.trim();
      product.price = Number(price);
      this.table.render();
    }
  }

  deleteProduct(id) {
    this.products = this.products.filter((p) => p.id !== id);
    this.table.render();
  }

  getProduct(id) {
    return this.products.find((p) => p.id === id);
  }
}
