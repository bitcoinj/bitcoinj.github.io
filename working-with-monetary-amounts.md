---
layout: base
title: "Working with monetary amounts"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

## The Coin class

Bitcoin amounts in the bitcoinj API are represented using the `Coin` class. `Coin` is superficially similar to `BigInteger` except that it wraps a long internally and thus cannot represent arbitrarily large quantities of bitcoin. As there is a global limit on how many bitcoins can exist this is unlikely to pose an issue for the forseeable future. The raw number of satoshis represented by a `Coin` instance is accessible via the public final field `value`, and the rest of the class is about making it easier and more type safe to work with these amounts.

Methods are provided to do the following operations in a type safe manner:

1. add, subtract, multiply, divide, divideAndRemainder
2. isPositive, isNegative, isZero, isGreaterThan, isLessThan
3. shift left, shift right, negate
4. parse from string, for example `Coin.parseCoin("1.23")` will parse the given amount as a bitcoin quantity.
5. build from a raw value in satoshis

There are also static instances representing ZERO, COIN, CENT, MILLICOIN, MICROCOIN, SATOSHI and FIFTY_COINS.

`Coin` implements `Comparable`, `Serializable` and also the bitcoinj provided `Monetary` interface. The `Monetary` interface represents any monetary amount in any currency, represented as a long with a "smallest unit exponent". For Bitcoin this is 8 but for most national/state currencies it will be either two or zero.

## Formatting

bitcoinj provides two APIs for formatting `Coin` amounts to and from strings:

1. `MonetaryFormat` is an immutable formatting class that can be configured to use various different denominations (BTC, mBTC, uBTC etc), varying numbers of digits after the decimal point, rounding modes, and allowing the currency code to be placed before or after the amount. Some pre-configured instances are provided as static instances on both `MonetaryFormat` and `Coin`. `MonetaryFormat` is intended to be usable with fiat currencies as well as Bitcoin.
2. `BtcFormat` is a larger and more complex API that builds on the Java `java.text.Format` infrastructure. It has extensive JavaDocs that explain its many features, including but not limited to: automatic selection of the most appropriate denomination, ability to parse strings that include unicode Bitcoin symbols and denomination codes, padding of strings so that formatted amounts can align around the decimal point, locale sensitivity for formatting, and more.

Which API to use is up to you: they were contributed by two different contributors and we're waiting to gain experience in which ones are most popular, with an eye to creating a unified API in future.

</div>