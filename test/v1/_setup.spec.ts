import Axios from '@airgap/coinlib-core/dependencies/src/axios-0.19.0'

const MockAdapter = require('axios-mock-adapter')

// This sets the mock adapter on the default instance
const mock = new MockAdapter(Axios)

// Expected order of requests:
const responses = [
  [
    'POST',
    'https://public-node.rsk.co',
    200,
    {
      jsonrpc: '2.0',
      id: 1,
      result: '0x7bd9'
    }
  ],
  [
    'POST',
    'https://public-node.rsk.co',
    200,
    {
      jsonrpc: '2.0',
      id: 1,
      result: '0xdde0b6b3a7640000'
    }
  ],
  [
    'POST',
    'https://public-node.rsk.co',
    200,
    {
      jsonrpc: '2.0',
      id: 1,
      result: '0x0'
    }
  ],
  [
    'POST',
    'https://public-node.rsk.co',
    200,
    {
      jsonrpc: '2.0',
      id: 1,
      result: '0xdde0b6b3a7640000'
    }
  ],
  [
    'POST',
    'https://public-node.rsk.co',
    200,
    {
      jsonrpc: '2.0',
      id: 1,
      result: '0x0'
    }
  ]
]

// Match ALL requests
mock.onAny().reply((config) => {
  const [method, url, ...response] = responses.shift()
  if (config.url === url && config.method.toUpperCase() === method) return response
  // Unexpected request, error out
  console.log('UNMOCKED URL, RETURNING ERROR 500', config.url)
  return [500, {}]
})

//mock.onAny().passThrough()
