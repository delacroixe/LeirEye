// Mock vis-network antes de importar GraphView
jest.mock("vis-network/standalone", () => ({
  Network: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    off: jest.fn(),
    setData: jest.fn(),
    destroy: jest.fn(),
    fit: jest.fn(),
  })),
  DataSet: jest.fn().mockImplementation((data) => data),
}));

import GraphView from "./GraphView";

describe("GraphView", () => {
  test("componente existe y puede ser importado", () => {
    expect(GraphView).toBeDefined();
  });

  test("es un componente React válido", () => {
    expect(typeof GraphView).toBe("function");
  });
});
