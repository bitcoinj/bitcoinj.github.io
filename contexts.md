---
layout: base
title: "API Contexts"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

# The Context class

Starting with bitcoinj 0.13, the API features a class called `Context`, which is intended to handle all state and configuration that's shared within a single instance of the library. `Context` in 0.13 is incomplete and you will still find redundant and duplicated settings throughout the API, but eventually they will all move.

State that is in `Context` in 0.13:

* NetworkParameters
* A global map of transaction hash to TransactionConfidence objects (the `TxConfidenceTable`)
* A setting for the "event horizon": a depth in the block chain so high that we consider a re-org can never happen deeper than this. Parts of the library may delete data needed for re-orgs or measuring confidence after a transaction has been buried this deep. It defaults to 100 and you probably never need to change this.

State that is planned to move in future:

* The working directory where the library is allowed to store files
* The user thread
* URI of directory where static data files can be found, to work around lack of JAR support on Android

Eventually this work should make it easier to connect to multiple alt-coins simultaneously, as well as simplify and clean up the API.

# Backwards compatibility

Use of the `Context` class is optional in 0.13 to avoid breaking existing code. If you don't construct one and pass it to core classes like `Wallet` or `PeerGroup` then one will be created for you automatically and stashed in a private global variable, then used from that point on. So for now you only need to manually use contexts if you are attempting to run two separate instances of bitcoinj in the same process.

Because some parts of bitcoinj need to use the context but existing code does not pass one in, there is a three stage "fixup" process:

1. If no `Context` has yet been created, one is initialised with the `NetworkParameters` of the calling class and put into a global static variable.
2. If no pointer to a context has yet been stashed in a private thread local variable, the global variable is copied into it.
3. The contents of the thread local variable is returned.

The purpose of the thread local variable is to make it easier to migrate code that uses different instances of bitcoinj (e.g. for alt coins or to "reboot" the library) from different threads simultaneously. As bitcoinj is itself multi-threaded, this matters! Eventually this auto-magic will be deleted and explicit passing of `Context` into all classes that need it will be used instead.

# Log messages

You may see log messages being printed from 0.13 onwards if you use bitcoinj from a new thread, telling you to call `Context.propagate(ctx)` instead. This is related to the thread-local storage slot (step 2) above. If you use the library in a normal manner then you can ignore these messages and your code will still work due to the fallback to the global variable ... but you can suppress them by just propagating the context yourself.

</div>
