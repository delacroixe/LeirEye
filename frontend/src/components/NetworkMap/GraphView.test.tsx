import React from 'react';
import GraphView from './GraphView';

// Mock vis-network completamente antes de cualquier import
jest.mock('vis-network/standalone');

describe('GraphView', () => {
  beforeAll(() => {
    // Setup completo del mock antes de los tests
    const visNetwork = require('vis-network/standalone');
    visNetwork.Network = jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      setData: jest.fn(),
      destroy: jest.fn(),
    }));
    visNetwork.DataSet = jest.fn().mockImplementation((data) => data);
  });

  test('componente existe y puede ser importado', () => {
    expect(GraphView).toBeDefined();
  });

  test('es un componente React válido', () => {
    expect(typeof GraphView).toBe('function');
  });
});
