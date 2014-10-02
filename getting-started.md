---
layout: base
title: "An introduction to using the library"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

#An introduction to using the library

##Introduction

_This document describes how to use the code in 0.12, git master may be slightly different_

bitcoinj is implemented in Java 6 and thus can be used from any language that can target the JVM. This tutorial is available for Java, Python and JavaScript, but people have also used bitcoinj from Scala (a functional language), Clojure (a lisp like language), Ruby, and many others.

In this document we will go through the `ForwardingService` example app that comes with the distribution. When run, `ForwardingService` prints out an address and starts listening on the network. Sending coins to that address will result in them being sent onwards to an address given on the command line (minus a small fee).

Note that this tutorial assumes familiarity with the basics of the Bitcoin protocol. If you aren't already familiar with the structure of the block chain and how transactions work, please read [Satoshi's white paper](https://bitcoin.org/bitcoin.pdf) before this tutorial.


##Before we start

###A health warning

This library is not like other libraries. A Bitcoin API allows you to directly handle money, possibly large sums of other people's money. It is important to understand the following. **After completing this tutorial you are NOT qualified to write production applications**. You will have a flavor of how to write applications, but Bitcoin is a subtle and complex system.

**FAILURE TO UNDERSTAND WHAT YOU ARE DOING CAN CAUSE MONEY TO BE STOLEN OR PERMANENTLY DESTROYED**

These documents will help you learn how to use bitcoinj, but they are not yet completely comprehensive. If you are ever in any doubt at all, or just want some code review, please ask on our mailing list or on our forum for advice and a second opinion. Also, make sure you keep up with the latest versions of the software. Bug fixes happen all the time and any one of them could be required for the safety of your wallet. It's important that you frequently rebase onto new versions of the library, even though bitcoinj does not have a stable API.

##Pick your language

* <a href="/getting-started-java">Java</a>
* <a href="/getting-started-js">Javascript</a>

</div>