const mockNetwork = {
  on: jest.fn(),
  setData: jest.fn(),
  destroy: jest.fn(),
};

const Network = jest.fn(() => mockNetwork);
const DataSet = jest.fn((data) => data);
const Options = {};

module.exports = {
  Network,
  DataSet,
  Options,
  mockNetwork,
};
