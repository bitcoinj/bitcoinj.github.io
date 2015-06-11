---
layout: base
title: "How to optimise downloading the block chain."
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

#Information on block chain sync optimisations

Bitcoin is a system that throws around large quantities of data. Often you don't really want all the data, just a subset of it. For instance any end user facing wallet app falls into this category - for performance reasons you don't want to handle the entire block chain. The wallet can work together with other classes in the library to implement various optimisations.

This article details various performance techniques implemented by bitcoinj that speed things up. It is for informational purposes only: all these optimisations are on by default and require no work from the developer.

##Fast catchup

Keys can have an associated creation time. If the wallet knows the creation times of all its keys, when you add it to a `PeerGroup` the _fast catchup time_ will be set for you. Block contents before the fast catchup time don't have to be downloaded, only the headers, so it's much faster to bootstrap the system in this way. If you're implementing a wallet app, this is a very useful optimization that will be taken advantage of automatically.

The fast catchup time can be set explicitly using `PeerGroup.setFastCatchupTime`, although it will be recalculated for you any time you add a wallet or add keys to a wallet. The time is simply set to the min of the earliest key creation time of all wallets, obtained by calling `Wallet.getEarliestKeyCreationTime()`.

##Checkpointing

Although fast catchup and Bloom filtering (see below) mean you can sync with the chain just by downloading headers and some transactions+Merkle branches, sometimes this is still too damn slow. A header is just 80 bytes, but there is one for every 10 minutes the system has been in operation. We can see through simple multiplication that headers alone takes around 4 megabytes of data for every year the system exists, so as of July 2013 a new user must still download and process over 16 megabytes of data to get started.

To solve this problem, we have checkpoint files. These are generated using the `BuildCheckpoints` tool that can be found in the tools module of the bitcoinj source code. `BuildCheckpoints` downloads headers and writes out a subset of them to a file. That file can then be shipped with your application. When you create a new `BlockStore` object, you can use that file to initialise it to whichever checkpointed block comes just before your wallets _fast catchup time_ (i.e. the birthday of the oldest key in your wallet). Then you only need to download headers from that point onwards. 

Checkpoints are called checkpoints because, like the upstream Satoshi client, once you've initialised the block store with one bitcoinj will refuse to re-organise (process chain splits) past that point. In fact, it won't even recognise that a re-org has taken place because the earlier blocks don't exist in the block store, thus the alternative fork of the chain will be seen merely as a set of orphan blocks. For this reason the `BuildCheckpoints` tool won't add any checkpoints fresher than one month from when it's run - it only takes a few seconds to download the last months worth of chain headers, and no fork is likely to ever be longer than one month.

##Bloom filtering

By default the `PeerGroup` and `Wallet` will work together to calculate and upload _Bloom filters_ to each connected peer. A _Bloom filter_ is a compact, privacy preserving representation of the keys/addresses in a wallet. When one is passed to a remote peer, it changes its behaviour. Instead of relaying all broadcast transactions and the full contents of blocks, it matches each transaction it sees against the filter. If the filter matches, that transaction is sent to your app, otherwise it's ignored. When a transaction is being sent to you because it's in a block, it comes with a _Merkle branch_ that mathematically proves the transaction was included in that block. BitcoinJ checks the Merkle branch for each transaction, and rejects any attempts to defraud you.

Bloom filters can be noisy. A noisy filter is one that matches more keys or addresses than are actually in your wallet. Noise is intentional and serves to protect your wallet privacy - a remote node can't know if a matched transaction is really yours or not. In theory, wallet keys/addresses could be split up across each connected node for even more privacy, but bitcoinj does not implement that currently. The noise added to a Bloom filter is controllable using `PeerGroup.setBloomFilterFalsePositiveRate`. Essentially it's a bandwidth vs privacy tradeoff - a higher FP rate confuses remote eavesdroppers more, but you have to download more useless data as a result. If you don't call that method, bitcoinj calculates Bloom filters with almost no false positives. In future this behaviour may change to be more privacy preserving by default.

Note that when Bloom filtering is used, your security is downgraded by a small amount - whilst remote peers cannot convince you transactions were included in a block if they weren't, they _can_ exclude transactions entirely and thus mount a kind of denial-of-service attack on you. If a peer does this, then bitcoinj won't notice and your balance may be incorrect until you rescan the block chain. You don't have to do anything to take advantage of Bloom filtering. It's done for you by the framework. From bitcoinj 0.10 onwards, peers that are too old to support Bloom filtering are automatically disconnected, to avoid you being flooded with broadcast traffic if you happen to connect to an old node.

</div>
