# Airgap-iso-Rootstock

airgap-iso-rootstock is isolated module for Airgap wallet and vault application. See ISO_MODULE_TEMPLATE.md file for more details about airgap isolated modules.

### Requirements

```
npm >= 6
NodeJS >= 12
```

## Getting started
- Clone the official: [airgap-coin-lib](https://github.com/airgap-it/airgap-coin-lib)
- After running `npm install` 
- Copy/Paste this repo(airgap-iso-rootstock) inside packages
- Add below changes in core and ethereum package
- coinlib-core:
  - Add rootstock option in Domain enum 
  - Add rootstock option in MainProtocolSymbols: ROOTSTOCK = 'rbtc',
  - Add rootstock option in SubProtocolSymbols:  RBTC_ERC20 = 'rbtc-erc20'
  - Add rootstock option in deriveAddresses function next to ETH
  - Similarly for networks.ts file add below line:
```
networks.rootstock = {
  messagePrefix: '\x19Rootstock Signed Message:\n',
  bip32: {
    public: 0xffffffff,
    private: 0xffffffff
  },
  scriptHash: 13,
  pubKeyHash: 0xff,
  wif: 0xff,
  ethereum: true
}
```

- ethereum:
  - Add these changes to ethereum package
  - In ethereum base protocol file change hard coded `ETH` fee label to `RBTC`
  - That's it

Build dependencies get installed using `npm install`.

### Build

```
$ git clone https://github.com/rsksmart/airgap-iso-rootstock
$ cd airgap-iso-rootstock
$ npm install
$ npm run build
```

### Contributing

We welcome contributions from the community. Simple readme updates or bugfixes can be addressed with a PR directly.
Make sure to take a look at the `develop` branch.
