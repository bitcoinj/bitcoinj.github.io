---
layout: base
title: "How to test applications"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

# How to test applications

Testing is obviously an important step for any software that uses money. This article explains some common techniques used to test Bitcoin apps.

## The testnet

The Bitcoin community runs a separate, parallel instance of the Bitcoin network that features a slightly different and more relaxed ruleset, called the _testnet_. Most usefully, coins on the testnet have no value and can be obtained for free from testnet faucet sites like [http://faucet.xeno-genesis.com/](http://faucet.xeno-genesis.com/) or [http://tpfaucet.appspot.com/](http://tpfaucet.appspot.com/).

You can make your app use the testnet by instantiating your objects with `TestNetParams.get()` instead of `MainNetParams.get()`. The wallet-tool app accepts a flag `--net=TEST` as well.

It's worth noting that whilst the testnet can be convenient, sometimes people mess it up by mining on it with ASICs. Such problems do not occur on the main network, so if you see large spurts of blocks found a few seconds apart, blocks that fail validation and so on, it's worth switching to a local regression test network instead: the environment is much more controlled and predictable.

## Regression test mode

The testnet is good as far as it goes, but it still has the issue that blocks are mined every ten minutes. Often you don't want to wait for a new block, and you don't want to have to use faucet sites to get test coins.

To simplify things, starting from Bitcoin Core 0.9 there is a new mode called regtest mode. You can run a local bitcoind in regtest mode like this:

~~~
./bitcoind -regtest
~~~

and once that's running, in another window you can do something like

~~~
./bitcoin-cli -regtest setgenerate true 101
~~~
(if you are using an older bitcoin-core version) respectively 
~~~
./bitcoin-cli -regtest generate 101
~~~
(if you are using bitcoin-core 0.11.0 or later)

... to create a new block on demand. Regtest mode requires the usage of yet another set of network params, `RegTestParams.get()`, and is designed to run only locally. There is no public regtest network. You can use `PeerGroup.connectToLocalHost()` to make it talk to the local bitcoind.

Note that newly mined coins have to mature (this is a general Bitcoin rule). This means they don't become spendable for 100 blocks. The number 101 in the command above selects how many blocks to mine. Thus this should give you spendable coins. Then you can send some test coins to your app like this:

~~~
./bitcoin-cli -regtest sendtoaddress <address of your app goes here> 10.0
./bitcoin-cli -regtest setgenerate true 1
~~~
(for older bitcoin-core versions) respectively
~~~
./bitcoin-cli -regtest sendtoaddress <address of your app goes here> 10.0
./bitcoin-cli -regtest generate 1
~~~
(for newer bitcoin-core versions)

The block chain and so on is stored in ~/.bitcoin/regtest, so you can delete it to start over again, or use -datadir to make the files be saved in a different location.

You can make wallet-tool use this mode using `--net=REGTEST --peers=localhost`.

Currently bitcoinj doesn't have a class that wraps the Bitcoin Core RPC interface and drives regtest mode, but it'd be a nice feature to have in future.

## Unit tests

Bitcoinj provides a `TestUtils` class that can do things like manufacture fake `Transaction` objects and so on. Take a look at the test suite for bitcoinj itself to see how to use the utilities. Unit tests are a great way to build robustness in your software, although due to the many subtle complexities of the Bitcoin protocol they're not always sufficient to ensure things work correctly.

</div>
