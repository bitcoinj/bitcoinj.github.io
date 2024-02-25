---
layout: base
title: "Getting started in Java"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

## Initial setup

**bitcoinj** has logging and assertions built in. Assertions are always checked by default regardless of whether the `-ea` flag is specified. Logging is handled by the [SLF4J](http://www.slf4j.org) library. It lets you choose which logging system you'd prefer to use, e.g. JDK logging, Android logging, etc. By default we use the simple logger which prints most stuff of interest to stderr. You can pick a new logger by switching out the jar file in the lib directory.

**bitcoinj** uses Gradle as its build system and is distributed via git. There are source code/jar downloads you can use, but it's more secure to get it directly from the source repository.

To get the code and install it, grab [Maven](https://maven.apache.org) or [Gradle](https://gradle.org), and add it to your path. Also make sure you have Git installed. Probably your Java IDE has some Maven/Gradle and Git integration too, but having them available via the command line is still very useful.

Now get the latest version of the code. You can use the instructions on the [Using Maven](/using-maven) or [Using Gradle](/using-gradle) page - just run the commands there and you'll get the right version of the code (unless this website is itself compromised). This is intended to protect against compromised mirrors or source downloads - because git works using source tree hashes, if you get a source hash in the right manner, you are guaranteed to end up with the right code.

You can [read the full program here](https://github.com/bitcoinj/bitcoinj/blob/release-0.16/examples/src/main/java/org/bitcoinj/examples/ForwardingService.java).

## Basic structure

A **bitcoinj** application uses the following objects:

 * a `NetworkParameters` instance which selects the network (production or test) you are on.
 * a `Wallet` instance to store your `ECKey`s and other data.
 * a `PeerGroup` instance to manage the network connections.
 * a `BlockChain` instance which manages the shared, global data structure which makes Bitcoin work.
 * a `BlockStore` instance which keeps the blockchain data structure somewhere, like on disk.
 * `WalletEventListener` implementations, which receive wallet events.

To simplify setting them up, there is also a `WalletAppKit` object that creates the above objects and connects them together. While you can do this manually (and for most "real" apps you would), this demo app shows how to use the app kit.

Let's go through the code and see how it works.

# Setup

We use a utility function to configure logging to have more compact, less verbose log formatting. Then we check the command line arguments.

{% highlight java %}
BriefLogFormatter.init();
if (args.length < 2) {
    System.err.println("Usage: address-to-send-back-to [regtest|testnet]");
    return;
}
{% endhighlight %}

Then we select the network we're going to use based on an optional command line parameter:

{% highlight java %}
// Figure out which network we should connect to. Each one gets its own set of files.
NetworkParameters params;
String filePrefix;
if (args[1].equals("testnet")) {
    params = TestNet3Params.get();
    filePrefix = "forwarding-service-testnet";
} else if (args[1].equals("regtest")) {
    params = RegTestParams.get();
    filePrefix = "forwarding-service-regtest";
} else {
    params = MainNetParams.get();
    filePrefix = "forwarding-service";
}
{% endhighlight %}

There are multiple separate, independent Bitcoin networks:

* The main or "production" network where people buy and sell things
* The public test network (testnet) which is reset from time to time and exists for us to play about with new features. 
* Regression test mode, which is not a public network and requires you to run a bitcoin daemon with the -regtest flag yourself.

Each network has its own genesis block, its own port number and its own address prefix bytes to prevent you accidentally trying to send coins across networks (which won't work). These facts are encapsulated in a `NetworkParameters` singleton object. As you can see, each network has its own class and you fetch the relevant `NetworkParameters` object by calling `get()` on one of those objects.

It's strongly recommended that you develop your software on the testnet or using regtest mode. If you accidentally lose test coins, it's no big deal as they are valueless, and you can get lots of them for free from a _TestNet faucet_. Make sure to send the coins back to the faucet when you're done with them, so others can use them too.

In regtest mode there's no public infrastructure, but you can get a new block whenever you want without having to wait for one by running `"bitcoin-cli -regtest -generate"` on the same machine as the regtest-mode bitcoind is running.

## Keys and addresses

Bitcoin transactions typically send money to a public elliptic curve key. The sender creates a transaction containing the address of the recipient, where the address is an encoded form of a hash of their public key. The recipient then signs a transaction claiming the coins with their own private key. A key is represented with the `ECKey` class. `ECKey` can contain private keys, or just public keys that are missing the private part. Note that in elliptic curve cryptography public keys are derived from private keys, so knowing a private key inherently means knowing the public key as well. This is different to some other crypto systems you may be familiar with, like RSA.

An address is a textual encoding of a public key. Actually, it is a 160-bit hash of a public key, with a version byte and some checksum bytes, encoded into text using a Bitcoin-specific encoding called base58. Base58 is designed to avoid letters and numbers that could be confused with each other when written down, such as 1 and uppercase i.

{% highlight java %}
// Parse the address given as the first parameter.
forwardingAddress = new Address(params, args[0]);
{% endhighlight %}

Because an address encodes the network for which the key is intended to be used, we need to pass in the network parameters here. The second parameter is just the user provided string. The constructor will throw if it's unparseable or for the wrong network.

## Wallet app kit

bitcoinj consists of various layers, each of which operates at a lower level than the last. A typical application that wants to send and receive money needs at least a `BlockChain`, a `BlockStore`, a `PeerGroup` and a `Wallet`. All those objects need to be connected to each other so data flows correctly. Read ["How things fit together"](/how-things-fit-together) for more information on how data flows through a bitcoinj based application.

To simplify this process, which often amounts to boilerplate, we provide a high level wrapper called `WalletAppKit`. It configures bitcoinj in _simplified payment verification_ mode (as opposed to full verification), which is the most appropriate mode to choose at this time unless you are an expert and wish to experiment with the (incomplete, likely buggy) full mode. It provides a few simple properties and hooks to let you modify the default configuration.

{% highlight java %}
// Start up a basic app using a class that automates some boilerplate. Ensure we always have at least one key.
kit = new WalletAppKit(params, new File("."), filePrefix) {
    @Override
    protected void onSetupCompleted() {
        // This is called in a background thread after startAndWait is called, as setting up various objects
        // can do disk and network IO that may cause UI jank/stuttering in wallet apps if it were to be done
        // on the main thread.
        if (wallet().getKeyChainGroupSize() < 1)
            wallet().importKey(new ECKey());
    }
};

if (params == RegTestParams.get()) {
    // Regression test mode is designed for testing and development only, so there's no public network for it.
    // If you pick this mode, you're expected to be running a local "bitcoind -regtest" instance.
    kit.connectToLocalHost();
}

// Download the block chain and wait until it's done.
kit.startAsync();
kit.awaitRunning();
{% endhighlight %}

The kit takes three arguments - the `NetworkParameters` (almost all APIs in the library require this), a directory in which to store files, and an optional string that is prefixed to any created files. This is useful if you have multiple different bitcoinj apps in the same directory that you wish to keep separated. In this case the file prefix is "forwarding-service" plus the network name, if not the main net (see the code above).

It also provides an overridable method that we can put our own code in, to customise the objects it creates for us. We override that here. Note that the appkit will actually create and set up the objects on a background thread, and thus `onSetupCompleted` is also called from a background thread.

Here, we simply check that the wallet has at least one key, and if not we add a fresh one. If we load a wallet from disk then of course this codepath is not taken.

Next up, we check if we're using regtest mode. If we are, then we tell the kit to connect only to localhost where a bitcoind in regtest mode is expected to be running.

Finally, we call `kit.startAsync()`. `WalletAppKit` is a [Guava Service](https://github.com/google/guava/wiki/ServiceExplained). Guava is a widely used utility library from Google that augments the standard Java library with some useful additional features. A service is an object that can be started and stopped (but only once), and you can receive callbacks when it finishes starting up or shutting down. You can also just block the calling thread until it's started with `awaitRunning()`, which is what we do here.

The `WalletAppKit` will consider itself started when the blockchain has been fully synced, which can sometimes take a while. You can [learn about how to make this faster](/speeding-up-chain-sync), but for a toy demo app it's not needed to implement any extra optimisations.

The kit has accessors on it that give access to the underlying objects it configures. You can't call these (they will assert) until the class is either started or in the process of starting up, because the objects would not be created.

After the app has started up, you'll notice there are two files in the directory where the app runs: a .wallet file, and a .spvchain file. They go together and must not be separated.

## Handling events

We want to know when we receive money so that we can forward it. This is an _event_ and like most Java APIs in bitcoinj you learn about events by registering _event listeners_, which are just objects that implement an interface. There are a handful of event listener interfaces in the library:

* `WalletEventListener` - for things that happen to your wallet
* `BlockChainListener` - for events related to the blockchain
* `PeerEventListener` - for events related to a peer in the network
* `TransactionConfidence.Listener` - for events related to the level of rollback security a transaction has

Most apps don't need to use all of these. Each interface provides a group of related events – you probably don't care about all of them.

{% highlight java %}
kit.wallet().addCoinsReceivedEventListener(new WalletCoinsReceivedEventListener() {
    @Override
    public void onCoinsReceived(Wallet w, Transaction tx, Coin prevBalance, Coin newBalance) {
        // Runs in the dedicated "user thread".
    }
});
{% endhighlight %}

Events in bitcoinj are run in a dedicated background thread that's just used for running event listeners, called the _user thread_. That means it may run in parallel to other code in your application, and if you're writing a GUI app, it means you aren't allowed to directly modify the GUI because you aren't in the GUI or "main" thread. However, your event listeners do not themselves need to be thread safe as events will queue up and execute in order. Nor do you have to worry about many other issues that commonly arise when using multi-threaded libraries (for instance, it's safe to re-enter the library and it's safe to do blocking operations).

## A note about writing GUI apps

Most widget toolkits like Swing, JavaFX or Android have what is called _thread affinity_, meaning you can only use them from a single thread. To get back from a background thread to the main thread, you normally pass a closure to some utility function that schedules the closure to be run when the GUI thread is idle.

To simplify the task of writing GUI apps with bitcoinj, you can specify an arbitrary [Executor](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/Executor.html) whenever you register an event listener. That executor will be asked to run the event listener. By default, this means passing the given `Runnable` to the user thread, but you can override that like this:

{% highlight java %}
Executor runInUIThread = new Executor() {
    @Override public void execute(Runnable runnable) {
        SwingUtilities.invokeLater(runnable);   // For Swing.
        Platform.runLater(runnable);   // For JavaFX.

        // For Android: handler was created in an Activity.onCreate method.
        handler.post(runnable);  
    }
};

kit.wallet().addEventListener(listener, runInUIThread);
{% endhighlight %}

Now methods on "listener" will be invoked in the UI thread automatically.

Because this can get repetitive and annoying, you can also change the default executor, so all events always run on your UI thread:

{% highlight java %}
Threading.USER_THREAD = runInUIThread;
{% endhighlight %}

In some cases bitcoinj can generate a large number of events very fast, this is typical when syncing the blockchain with a wallet that has a lot of transactions in it as each one can generate a transaction confidence changed event (as they get buried deeper and deeper). It's very likely that in future the way wallet events work will change to avoid this problem, but for now that's how the API works. If the user thread falls behind then memory bloat can occur as event listener invocations queue up on the heap. To avoid this, you can register event handlers with `Threading.SAME_THREAD` as the executor, in which case they will run immediately on bitcoinj controlled background threads. However, you must be exceptionally careful when using this mode - any exceptions that occur in your code may unwind bitcoinj stacks and cause peer disconnection, also, re-entering the library may cause lock inversions or other issues. Generally you should avoid doing it unless you really need the extra performance and know exactly what you're doing.

## Receiving money

{% highlight java %}
kit.wallet().addCoinsReceivedEventListener(new WalletCoinsReceivedEventListener() {
    @Override
    public void onCoinsReceived(Wallet w, Transaction tx, Coin prevBalance, Coin newBalance) {
        // Runs in the dedicated "user thread".
        //
        // The transaction "tx" can either be pending, or included into a block (we didn't see the broadcast).
        Coin value = tx.getValueSentToMe(w);
        System.out.println("Received tx for " + value.toFriendlyString() + ": " + tx);
        System.out.println("Transaction will be forwarded after it confirms.");
        // Wait until it's made it into the block chain (may run immediately if it's already there).
        //
        // For this dummy app of course, we could just forward the unconfirmed transaction. If it were
        // to be double spent, no harm done. Wallet.allowSpendingUnconfirmedTransactions() would have to
        // be called in onSetupCompleted() above. But we don't do that here to demonstrate the more common
        // case of waiting for a block.
        Futures.addCallback(tx.getConfidence().getDepthFuture(1), new FutureCallback<TransactionConfidence>() {
            @Override
            public void onSuccess(TransactionConfidence result) {
                // "result" here is the same as "tx" above, but we use it anyway for clarity.
                forwardCoins(result);
            }

            @Override
            public void onFailure(Throwable t) {}
        });
    }
});
{% endhighlight %}

Here we can see what happens when our app receives money. We print out how much we received, formatted into text using a static utility method.

Then we do something a bit more advanced. We call this method:

{% highlight java %}
ListenableFuture<TransactionConfidence> future = tx.getConfidence().getDepthFuture(1);
{% endhighlight %}

Every transaction has a confidence object associated with it. The notion of _confidence_ encapsulates the fact that Bitcoin is a global consensus system which constantly strives to reach agreement on a global ordering of transactions. Because this is a hard problem (when faced with malicious actors), it's possible for a transaction to be _double spent_ (in bitcoinj terminology we say it's "dead"). That is, it's possible for us to believe that we have received money, and later we discover the rest of the world disagrees with us.

_Confidence objects_ contain data we can use to make risk based decisions about how likely we are to have actually received money. They can also help us learn when confidence changes or reaches a certain threshold.

_Futures_ are an important concept in concurrent programming and bitcoinj makes heavy use of them, in particular, we use the Guava extension to the standard Java `Future` class, which is called [ListenableFuture](https://github.com/google/guava/wiki/ListenableFutureExplained). A `ListenableFuture` represents the result of some future calculation or state. You can wait for it to complete (blocking the calling thread), or register a callback that will be invoked. Futures can also fail, in which case you get back an exception instead of a result.

Here we request a _depth future_. This future completes when a transaction is buried by at least that many blocks in the chain. A depth of one means it appeared in the top block in the chain. So here, we're saying "run this code when the transaction has at least one confirmation". Normally you'd use a utility method called `Futures.addCallback`, although there is another way to register listeners as well which can be seen in the code snippet below.

Then we just invoke a method we define ourselves called `forwardCoins` when the transaction that sends us money confirms.

There's an important thing to note here. It's possible for a depth future to run, and then the depth of a transaction changes to be less than the future's parameter. This is because at any time the Bitcoin network may undergo a "reorganisation", in which the best known chain switches from one to another. If your transaction appears in the new chain at a different place, the depth may actually go down instead of up. When processing an inbound payment, you should ensure that if a transaction's confidence goes down, you try to abort whatever service you were providing for that money. You can learn more about this topic by reading up on the [SPV security model](/security-model).

Handling of re-orgs and double spends is a complex topic that is not covered in this tutorial. You can learn more by reading the other articles.

## Sending coins

The final part of the ForwardingService is sending the coins we just received onwards.

{% highlight java %}
Coin value = tx.getValueSentToMe(kit.wallet());
System.out.println("Forwarding " + value.toFriendlyString() + " BTC");
// Now send the coins back! Send with a small fee attached to ensure rapid confirmation.
final Coin amountToSend = value.subtract(Transaction.REFERENCE_DEFAULT_MIN_TX_FEE);
final Wallet.SendResult sendResult = kit.wallet().sendCoins(kit.peerGroup(), forwardingAddress, amountToSend);
System.out.println("Sending ...");
// Register a callback that is invoked when the transaction has propagated across the network.
// This shows a second style of registering ListenableFuture callbacks, it works when you don't
// need access to the object the future returns.
sendResult.broadcastComplete.addListener(new Runnable() {
    @Override
    public void run() {
         // The wallet has changed now, it'll get auto saved shortly or when the app shuts down.
         System.out.println("Sent coins onwards! Transaction hash is " + sendResult.tx.getHashAsString());
    }
});
{% endhighlight %}

Firstly we query how much money we received (of course this is the same as `newBalance` in the `onCoinsReceived` callback above, due to the nature of our app).

Then we decide how much to send - it's the same as what we received, minus a fee. We don't have to attach a fee, but if we don't, it might take a while to confirm. The default fee is quite low.

To send coins, we use the wallets `sendCoins` method. It takes three arguments: a `TransactionBroadcaster` (which is usually a `PeerGroup`), the address to send coins to (here we use the address we parsed from the command line earlier) and how much money to send.

`sendCoins` returns a `SendResult` object containing both the transaction that was created, and a `ListenableFuture` that can be used to find out when the network has accepted the payment. If the wallet doesn't contain enough money, the `sendCoins` method will throw an exception containing some info about how much money was missing.

## Customizing the sending process and setting fees

Transactions in Bitcoin can have fees attached. This is useful as an anti-denial-of-service mechanism, but it's primarily intended to incentivise mining in later years of the system when inflation has dropped off. You can control the fee attached to a transaction by customizing a send request:

{% highlight java %}
SendRequest req = SendRequest.to(address, value);
req.feePerKb = Coin.parseCoin("0.0005");
Wallet.SendResult result = wallet.sendCoins(peerGroup, req);
Transaction createdTx = result.tx;
{% endhighlight %}

Note that here, we actually set a fee per kilobyte of created transaction. This is how Bitcoin works - priority of a transaction is determined by fee divided by size, thus larger transactions require higher fees to be considered "the same" as smaller transactions.

## Where to go from here?

There are many other features in bitcoinj that this tutorial does not cover. You can read the other articles to learn more about full verification, wallet encryption and so on, and of course the JavaDocs detail the full API.

</div>
