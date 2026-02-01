// Mock vis-network antes de importar GraphView
vi.mock("vis-network/standalone", () => ({
  Network: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    off: vi.fn(),
    setData: vi.fn(),
    destroy: vi.fn(),
    fit: vi.fn(),
  })),
  DataSet: vi.fn().mockImplementation((data) => data),
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
