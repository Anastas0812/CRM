import { CRM } from "../CRM/CRM.js";

jest.mock("../CRM/Table.js", () => ({
  Table: jest.fn().mockImplementation(() => ({
    render: jest.fn(),
  })),
}));

jest.mock("../CRM/Modal.js", () => ({
  Modal: jest.fn().mockImplementation(() => ({
    openForAdd: jest.fn(),
    close: jest.fn(),
  })),
}));

describe("CRM", () => {
  let crm;

  beforeEach(() => {
    crm = new CRM();
  });

  describe("constructor and init", () => {
    test("should initialize with empty products array", () => {
      expect(crm.products).toEqual([]);
      expect(crm.currentEditId).toBeNull();
    });

    test("should create table and modal instances", () => {
      expect(crm.table).toBeDefined();
      expect(crm.modal).toBeDefined();
      expect(crm.table.render).toHaveBeenCalled();
    });
  });

  describe("addProduct", () => {
    test("should add product to products array", () => {
      const initialLength = crm.products.length;

      crm.addProduct("Новый товар", "100.50");

      expect(crm.products).toHaveLength(initialLength + 1);
      expect(crm.products[0].name).toBe("Новый товар");
      expect(crm.products[0].price).toBe(100.5);
      expect(crm.products[0].id).toBeDefined();
    });

    test("should trim product name", () => {
      crm.addProduct("  Товар с пробелами  ", "200");

      expect(crm.products[0].name).toBe("Товар с пробелами");
    });

    test("should convert price to number", () => {
      crm.addProduct("Товар", "300.75");

      expect(typeof crm.products[0].price).toBe("number");
      expect(crm.products[0].price).toBe(300.75);
    });

    test("should call table.render after adding", () => {
      crm.addProduct("Товар", 100);

      expect(crm.table.render).toHaveBeenCalled();
    });
  });

  describe("updateProduct", () => {
    beforeEach(() => {
      crm.products = [
        { id: 1, name: "Старое название", price: 100 },
        { id: 2, name: "Другой товар", price: 200 },
      ];
    });

    test("should update existing product", () => {
      crm.updateProduct(1, "Новое название", "150.99");

      const updatedProduct = crm.products.find((p) => p.id === 1);
      expect(updatedProduct.name).toBe("Новое название");
      expect(updatedProduct.price).toBe(150.99);
    });
  });

  describe("deleteProduct", () => {
    beforeEach(() => {
      crm.products = [
        { id: 1, name: "Товар 1", price: 100 },
        { id: 2, name: "Товар 2", price: 200 },
        { id: 3, name: "Товар 3", price: 300 },
      ];
    });

    test("should delete product by id", () => {
      crm.deleteProduct(2);

      expect(crm.products).toHaveLength(2);
      expect(crm.products.find((p) => p.id === 2)).toBeUndefined();
      expect(crm.products.map((p) => p.id)).toEqual([1, 3]);
    });

    test("should call table.render after deletion", () => {
      crm.deleteProduct(1);
      expect(crm.table.render).toHaveBeenCalled();
    });
  });

  describe("getProduct", () => {
    beforeEach(() => {
      crm.products = [
        { id: 1, name: "Товар 1", price: 100 },
        { id: 2, name: "Товар 2", price: 200 },
      ];
    });

    test("should return product by id", () => {
      const product = crm.getProduct(2);

      expect(product).toEqual({ id: 2, name: "Товар 2", price: 200 });
    });

    test("should return undefined for non-existent product", () => {
      const product = crm.getProduct(999);

      expect(product).toBeUndefined();
    });
  });
});
