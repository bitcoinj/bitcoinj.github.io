---
layout: base
title: "Limitations and missing features."
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

#Limitations and missing features.

##Introduction

_This page reflects git master, not the current release_

bitcoinj is a work in progress, and lacks some features you probably consider important. It also has strange quirks and other issues that should be fixed, but nobody has had time to do so (there were always higher priorities).

A lot of these quirks persist because the primary goal of the project has always been to support SPV smartphone wallets, with other use cases being treated as secondary priorities. Hence making the Android wallet perform well has repeatedly evicted other features and refactorings.

For a full list, see [the bug tracker](https://code.google.com/p/bitcoinj/issues/list). What is listed below is a small selection of the most important limitations. Patches are always welcome.

##Bugs and other problems

* The Wallet code doesn't scale, at all. All transactions that were ever relevant to the wallet are loaded into memory, all the time, and re-written every time the wallet is saved. This results in a simple on-disk format accessible to many kinds of apps, but has poor performance for heavy users. In time we'll probably switch to a log structured wallet file format to solve this.

##Security issues

* The default coin selector is not very smart, which means you can do a denial-of-service attack against anyone for whom you have an address by sending lots of tiny coins. bitcoinj will try and use them to fulfil spends and hit the size/fee limits mentioned in the previous points. Also, the wallet can only create one transaction for one spend request (like all other Bitcoin implementations). If a transaction goes over-size, you simply cannot create spends anymore unless you manually break the values required down yourself.
* SPV mode vs full verification is an important topic to understand, read the [SecurityModel](/security-model) page for more information on this.
* Support for double spend detection is incomplete. Double spends are only handled in a few specific cases. General support requires upgrades to the global Bitcoin protocol.
* BitcoinJ always bootstraps from DNS seeds. It does not store or use address broadcasts. That means if DNS seeds were all to go down, bitcoinj apps would stop working, and if they were compromised and started returning attacker-controlled nodes the apps would become subject to a Sybil attack (see the [SecurityModel](/security-model) page for more information on this).
* Some features, like seeing pending transactions, rely on polling your randomly selected peers. This opens up users/wallets that are relying on unconfirmed transactions to sybil attacks. In future versions we may switch to using Tor by default to resolve this.
* Bouncy Castle is used for ECDSA signing by default, and this library is both slow and almost certainly vulnerable to various timing attacks. A new version of Bouncy Castle which is much faster and more robust will soon become available, and we'll upgrade at that time.
* The code has not been professionally audited by security specialists and may have other, unexpected security holes (unfortunately this is true for most bitcoin related software). The library has been written for mobile wallets that don't contain large amounts of value and that is still the primary focus.

##Privacy issues

* Keys are always generated randomly, with no determinism. Thus most wallets and users default to reusing keys, which leaks private data. (_note: bitcoinj in git master/0.12 does not have this problem_)
* Bloom filters are always set very tightly at the moment. The reason is that the API has no notion of bandwidth modes, and no code to measure bandwidth usage and adjust FP rates to keep it within bounds. Because bitcoinj is used on a wide variety of internet connections, this work needs to be done before we can start garbling filters.
* The Bloom filtering code has various bugs and obscure attacks that would allow a malicious peer to learn more about your address list than should be possible.

##Protocol compliance

* Full verification mode does not support the v2 block format (where the height is embedded in the coinbase transactions). It also may still contain chain splitting bugs. It's experimental and should be treated as such.

##Micropayment channels 

* Security issue: the Bitcoin network allows transaction malleability. With the code in 0.10, a malicious server could modify the contract tx before broadcasting it, rendering the refund useless and allowing extortion of the user.

##API warts

* The `Wallet` class is huge and has a bunch of inner classes that could be refactored out. At some point we'll probably move this to a separate package.
* Some core objects like `Block` and `Transaction` should be immutable but aren't. The `TransactionConfidence` objects are attached to `Transaction`, but should really be separated - this means that `Transaction` objects occasionally need to be canonicalised using an interning table and the right time to do this is often non-obvious.
