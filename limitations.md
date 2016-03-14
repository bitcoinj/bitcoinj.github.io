---
layout: base
title: "Limitations and missing features."
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

# Limitations and missing features.

## Introduction

bitcoinj is a work in progress, and lacks some features you probably consider important. It also has strange quirks and other issues that should be fixed, but nobody has yet had time to do so (there were always higher priorities).

A lot of these quirks persist because the primary goal of the project has always been to support SPV smartphone wallets, with other use cases being treated as secondary priorities. Hence making the Android wallet perform well has repeatedly evicted other features and refactorings.

For a full list, see [the bug tracker](https://github.com/bitcoinj/bitcoinj/issues). What is listed below is a small selection of the most important limitations. Patches are always welcome.

## Bugs and other problems

* The Wallet code doesn't scale well. All transactions that were ever relevant to the wallet are loaded into memory, all the time, and re-written every time the wallet is saved. This results in a simple on-disk format accessible to many kinds of apps, but has poor performance for heavy users. In time we'll probably switch to a log structured wallet file format to solve this.

## Security issues

* The default coin selector is not very smart, which means you can do a denial-of-service attack against anyone for whom you have an address by sending lots of tiny coins. bitcoinj will try and use them to fulfil spends and hit the size/fee limits mentioned in the previous points. Also, the wallet can only create one transaction for one spend request (like all other Bitcoin implementations). If a transaction goes over-size, you simply cannot create spends anymore unless you manually break the values required down yourself.
* SPV mode vs full verification is an important topic to understand, read the [SecurityModel](/security-model) page for more information on this.
* Support for double spend detection is incomplete. Double spends are only handled in a few specific cases. General support requires upgrades to the global Bitcoin protocol.
* BitcoinJ always bootstraps from DNS seeds. It does not store or use address broadcasts. That means if DNS seeds were all to go down, bitcoinj apps would stop working, and if they were compromised and started returning attacker-controlled nodes the apps would become subject to a Sybil attack (see the [SecurityModel](/security-model) page for more information on this).
* Some features, like seeing pending transactions, rely on polling your randomly selected peers. This opens up users/wallets that are relying on unconfirmed transactions to sybil attacks. In future versions we may switch to using Tor by default to resolve this.
* The code has not been professionally audited by security specialists and may have other, unexpected security holes (unfortunately this is true for most bitcoin related software). The library has been written for mobile wallets that don't contain large amounts of value and that is still the primary focus.

## Privacy issues

* Bloom filters are always set very tightly at the moment. The reason is that the API has no notion of bandwidth modes, and no code to measure bandwidth usage and adjust FP rates to keep it within bounds. Additionally building chains of filters that "lie coherently" is a challenging research problem.
* Bitcoin P2P traffic is unencrypted (this is a limitation of Bitcoin rather than bitcoinj)

## Protocol compliance

* Full verification mode does not support the v2 block format (where the height is embedded in the coinbase transactions). It also may still contain chain splitting bugs. It's experimental and should be treated as such.

## Micropayment channels 

* Security issue: the Bitcoin network allows transaction malleability. With the code in 0.10, a malicious server could modify the contract tx before broadcasting it, rendering the refund useless and allowing extortion of the user.

## API warts

* The `Wallet` class is huge and has a lot of functionality that could be refactored out. At some point we'll probably move this to a separate package.
* Some core objects like `Block` and `Transaction` should be immutable but aren't.
* Most core objects are thread safe but thread safety isn't always documented as precisely as it could be.
* Each event should have a single interface, but instead there are just a handful with many methods each (one for each peer). This makes the API awkward to use with lambdas, such as in Java 8 or Kotlin or really any language more modern than Java 6. At some point we will make these events more fine grained.
* Some "events" are actually more like customisation points (they return data) and are only invoked if your event listener is registered for the SAME_THREAD executor. This is documented, but sometimes trips people up.
* Some configuration state is duplicated throughout the library. The Context class introduced in 0.13 is a step towards fixing this.