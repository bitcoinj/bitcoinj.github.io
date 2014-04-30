---
layout: base
title: "Working with micropayment channels"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

#Working with micropayment channels

_Learn how to efficiently send repeated micropayments to a chosen recipient._

##Introduction

Bitcoin has great potential as a platform for enabling _micropayments_, payments much smaller than what the traditional financial system can handle. Indeed, you can send a very tiny amount of value in a Bitcoin transaction without doing anything special and it will work, even if what you're sending is only a fraction of a (dollar) cent. But doing so is subject to a few significant caveats.

1. If you send too many transactions too fast, they will get down-prioritised or not relayed by various anti flooding algorithms built into the Bitcoin network.
2. There is a minimum amount of value a single transaction can send, determined by the number of bytes required to send and claim it along with the fees charged.
3. The recipient of the micropayments ends up with a wallet full of "dust" which can be expensive to spend, fee-wise. This is a rough equivalent of the same problem you'd have with metal coins, if you charged lots of people a penny, repeatedly. You'd end up with a bag full of tiny metal coins that most merchants would refuse to accept as payment, because the overhead of the transaction would be larger than what the money was worth.

Sometimes these restrictions don't matter - you only wish to make a single, very small payment and the recipient won't be receiving a lot of them anyway. But other times these restrictions are too limiting and we must search for an alternative approach. This article describes how to use _payment channels_, a way to set up a pending transfer of value from one wallet to another such that the amount that will be transferred is incrementable at high speed and by very small amounts. Whilst this does not allow you to send micropayments at high speed to different recipients each time, many applications can fit within this framework - typically anything that involves micro-billing for a metered service.

Starting from bitcoinj 0.10, you can use payment channels to implement various kinds of metered billing application. We provide a sub-library that implements a client/server protocol for this, along with an example client/server app showing how easy it is to use. Because payment channel technology is still new and experimental, if you wish to use it please get in touch with us first and let us know what you're doing, so we ensure you keep up as the code evolves.

##Protocol overview

The [micropayment protocol](https://en.bitcoin.it/wiki/Contracts#Example_7:_Rapidly-adjusted_.28micro.29payments_to_a_pre-determined_party) allows one party (the client) to make repeated micropayments to another party (the server). It works in two stages. Firstly, some value is locked up with a multi-signature transaction that places it under the control of both parties. The parties collaborate to create a signed refund transaction that spends all the value back to the client, but is time locked using the nLockTime feature of the Bitcoin protocol. This ensures that the refund won't become valid until some period of time has passed (currently, one day).

The refund transaction is prepared in such a way that the client gets a fully signed copy _before_ the initial multi-signature transaction (the _contract_) is sent to the server. In this way, we avoid a potential crash/attack that could cause the client to lose money - once the client receives the refund transaction, only then is the money locked to both parties control. If the server halts at any point in the protocol, the client can always get their money back.

Once the refund transaction has been obtained by the client, it transmits the multi-signature contract to the server which then signs it and broadcasts it, thus locking in the money and opening the channel. To make a payment the client prepares and signs a new copy of the refund transaction that refunds slightly less money than before. The signature is sent to the server, which then verifies the signature is correct and stores it. The signature uses fairly lax SIGHASH modes so the server has a lot of leeway to modify the refund transaction as it wishes, but normally it will just add an output that sends back to its own wallet.

In this way once the payment channel is established, a micropayment can be made with just one signature operation by the client and one verify by the server.

Eventually the client will decide that it is done. At this point it sends a message to the server asking it to close the channel. The server then signs the final version of the contract with its own key and broadcasts it, resulting in the final state of the channel being confirmed in the block chain. If the server doesn't co-operate or has vanished before the client gets a chance to cleanly close the channel then the client must wait 24 hours until the initial refund transaction becomes valid.

As you can see, because the refund transaction lets the client take back all its money if the channel is still in use as it approaches the expiry time, the server must close the channel and a new one must be built from scratch.

##API design

Bitcoinj provides a series of objects that implement the client and server parts of the above arrangement. The wire protocol uses TCP to send uint-length-prefixed protocol buffers, but the system is designed to be embeddable so you can easily bind micropayments into other protocols, like HTTP or XMPP.

1. At the heart of the API are two _state objects_, `PaymentChannelClientState` and `PaymentChannelServerState`. These classes operate independently of any particular network protocol and provide a state machine in which you're responsible for providing and retrieving the correct objects at the right times. For example, when calling the `incrementPaymentBy` method, what you get back is a byte array containing a signature, but the state objects won't do any transmission of that data for you.
2. Normally though you want to serialize these state machine transitions into byte arrays, ready for network transmission. Also, you want to persist that state machine to disk such that you can resume micropayments across application restarts or network connectivity interruptions. This is implemented by `PaymentChannelClient` and `PaymentChannelServer`. These objects take the basic channel parameters and an object that implements a client/server specific interface. They construct the state machines, serialize the transitions to protocol buffer based messages, and use a wallet extension (see third point) to ensure data on the channel is stored inside the wallet file. They also do error checking of the protocol to ensure a malicious client or server can't do anything strange.
3. The protocol requires certain actions to be taken at certain times, where time is defined by the time fields in the block chain. The `StoredPaymentChannel{Client/Server}States` act as wallet extensions and watch the block chain to take the right actions at the right times. That means if you drive the state machine classes directly, refund transactions won't be broadcast at the right time for you and you'll have to implement that logic yourself.
4. Although getting/providing protocol buffers is a big step up over raw Java objects, it's still not quite enough as we have to handle reading and writing them to the network. Often the micropayment protocol will be embedded inside another protocol. But if you want it to run standalone (e.g. for testing), we provide the `PaymentChannelClientConnection` and `PaymentChannelServerListener` classes. They take host/port pairs and the channel parameters then construct and glue together the rest of the objects. They delegate the actual network handling code to a separate package (com.google.bitcoin.protocols.niowrapper) which simply reads/writes length prefixed protocol buffers over a TCP connection.

Although this may seem like a lot of objects, the abstractions have a purpose. Imagine building a protocol that lets you pay for not seeing display ads on the web by making private micropayments to ad networks at the time the ad is going to be served. A separate TCP connection is probably not the right tool to be used here. Instead it would make more sense to extend HTTP with some special headers and link the browser to your wallet app, so the micropayments protocol flows over those inline HTTP headers. In that case you'd want to use the state machine and possibly protobuf serialization, but the network code itself might not be that useful. Going even further, if you're embedding the protocol into something that already has its own serialization mechanism you might want to reuse the core state machines but avoid protocol buffers entirely. All these use cases are possible.

##Tutorial

###Server

Let's take a walk through the toy server included in the examples package.

{% highlight java %}
public void run() throws Exception {
    NetworkParameters params = TestNet3Params.get();

    // Bring up all the objects we need, create/load a wallet, sync the chain, etc. We override WalletAppKit so we
    // can customize it by adding the extension objects - we have to do this before the wallet file is loaded so
    // the plugin that knows how to parse all the additional data is present during the load.
    appKit = new WalletAppKit(params, new File("."), "payment_channel_example_server") {
        @Override
        protected void addWalletExtensions() {
            // The StoredPaymentChannelServerStates persists channels so we can resume them
            // after a restart.
            storedStates = new StoredPaymentChannelServerStates(wallet(), peerGroup());
            wallet().addExtension(storedStates);
        }
    };
    appKit.startAndWait();

    // We provide a peer group, a wallet, a timeout in seconds, the amount we require to start a channel and
    // an implementation of HandlerFactory, which we just implement ourselves.
    new PaymentChannelServerListener(appKit.peerGroup(), appKit.wallet(), 15, Utils.COIN, this).bindAndStart(4242);
}
{% endhighlight %}

Here is the core of a normal, plain old bitcoinj app. We select our network parameters, the testnet in this case, and then construct a `WalletAppKit` which gives us everything we need to do business with Bitcoin. The only unusual thing here is that we subclass the app kit and override one of its methods, `addWalletExtensions`.

_Wallet extensions_ are a plugin mechanism that lets you persist arbitrary data inside a bitcoinj wallet file (which is basically a large protocol buffer). They are Java objects implementing a specific interface and the payment channels code provides an extension so channel state can be saved automatically. The extension object has to be added to the wallet object _before_ it's loaded from disk however, to ensure that the saved extension data is deserialized correctly. We do that here by using a hook that `WalletAppKit` provides for us. All apps that use micropayment channels need to do this.

It's important to note that the wallet extension takes a `PeerGroup` as an argument. The reason is so that as a channel approaches its expiry time, the server knows to close it and broadcast the final state before the client has a chance to use its refund transaction. If the server is only running intermittently then it's possible for it to lose all the money that was accumulated so far, so if your server is transient make sure the operating system wakes it up at the right times!

Once we have brought up our connections to the Bitcoin network and synced the chain, we bind and start the server object. We give a timeout that is used for network communications (this is distinct from the max lifetime of the channel, which is currently hard coded). It is given "this" as a parameter - the reason is that the `PaymentChannelServerListener` class will call us back when a new inbound connection is made. We're expected to return from that global callback an object that will receive callbacks for that specific connection. So let's do that.

{% highlight java %}
@Override
public ServerConnectionEventHandler onNewConnection(final SocketAddress clientAddress) {
    // Each connection needs a handler which is informed when that payment channel gets adjusted. Here we just log
    // things. In a real app this object would be connected to some business logic.
    return new ServerConnectionEventHandler() {
        @Override
        public void channelOpen(Sha256Hash channelId) {
            log.info("Channel open for {}: {}.", clientAddress, channelId);

            // Try to get the state object from the stored state set in our wallet
            PaymentChannelServerState state = null;
            try {
                state = storedStates.getChannel(channelId).getState(appKit.wallet(), appKit.peerGroup());
            } catch (VerificationException e) {
                // This indicates corrupted data, and since the channel was just opened, cannot happen
                throw new RuntimeException(e);
            }
            log.info("   with a maximum value of {}, expiring at UNIX timestamp {}.",
                    // The channel's maximum value is the value of the multisig contract which locks in some
                    // amount of money to the channel
                    state.getMultisigContract().getOutput(0).getValue(),
                    // The channel expires at some offset from when the client's refund transaction becomes
                    // spendable.
                    state.getRefundTransactionUnlockTime() + StoredPaymentChannelServerStates.CHANNEL_EXPIRE_OFFSET);
        }

        @Override
        public void paymentIncrease(BigInteger by, BigInteger to) {
            log.info("Client {} paid increased payment by {} for a total of " + to.toString(), clientAddress, by);
        }

        @Override
        public void channelClosed(PaymentChannelCloseException.CloseReason reason) {
            log.info("Client {} closed channel for reason {}", clientAddress, reason);
        }
    };
}
{% endhighlight %}

The interface is simple - we're informed when a channel is successfully opened, along with a "channel ID" which identifies it in a way independent of the network layer. Once we have the channelId, we can query the wallet extension that we created earlier to get the canonical state object, which we can get more detailed information about the channel from. For most use cases, this is likely not necessary, as the wallet extension deals with channel expiration for you and channel maximum value is not a particularly useful statistic (a minimum is already specified in the server listener constructor, which most clients will default to).

After the channelOpen callback, we're told when we received a new payment, and, finally we're told when the channel is closed, and why.


###Client

On the client side, the first part looks much the same, except in the wallet we add a `StoredPaymentChannelClientStates` - note **Client** instead of **Server**.

Next up, we pick some channel parameters and then try to construct a `PaymentChannelClientConnection` object. This might resume a previous payment channel if we have one available with the same channel ID. The channel ID is just an opaque string that is sent as a hash to the server. In this case we set it to be the hostname, so talking to the same server will always use the same channel even if both sides are restarted or their IP address changes.

We then start a loop where we try and construct the channel, but if we don't have enough money in our wallet yet we wait until we do and then try again.

{% highlight java %}
// Create the object which manages the payment channels protocol, client side. Tell it where the server to
// connect to is, along with some reasonable network timeouts, the wallet and our temporary key. We also have
// to pick an amount of value to lock up for the duration of the channel.
//
// Note that this may or may not actually construct a new channel. If an existing unclosed channel is found in
// the wallet, then it'll re-use that one instead.
final int timeoutSecs = 15;
final InetSocketAddress server = new InetSocketAddress(host, 4242);
PaymentChannelClientConnection client = null;

while (client == null) {
    try {
        final String channelID = host;
        client = new PaymentChannelClientConnection(
                server, timeoutSecs, appKit.wallet(), myKey, maxAcceptableRequestedAmount, channelID);
    } catch (ValueOutOfRangeException e) {
        // We don't have enough money in our wallet yet. Wait and try again.
        waitForSufficientBalance(maxAcceptableRequestedAmount);
    }
}
{% endhighlight %}

The `waitForSufficientBalance` method is simple and not specific to micropayments, but we include it here for completeness:

{% highlight java %}
private void waitForSufficientBalance(BigInteger amount) {
    // Not enough money in the wallet.
    BigInteger amountPlusFee = amount.add(Wallet.SendRequest.DEFAULT_FEE_PER_KB);
    ListenableFuture<BigInteger> balanceFuture = appKit.wallet().getBalanceFuture(amountPlusFee, Wallet.BalanceType.AVAILABLE);
    if (!balanceFuture.isDone()) {
        System.out.println("Please send " + Utils.bitcoinValueToFriendlyString(amountPlusFee) +
                " BTC to " + myKey.toAddress(params));
        Futures.getUnchecked(balanceFuture);  // Wait.
    }
}
{% endhighlight %}

Once we have a successfully constructed `PaymentChannelClientConnection` we wait for it to newly open (or resume):

{% highlight java %}
// Opening the channel requires talking to the server, so it's asynchronous.
Futures.addCallback(client.getChannelOpenFuture(), new FutureCallback<PaymentChannelClientConnection>() {
    @Override public void onSuccess(PaymentChannelClientConnection client) { .... }
    @Override public void onFailure(Throwable throwable) { .... }
}
{% endhighlight %}

Because it involves some network chatter, this process is asynchronous and we get back a future that let's us know when it's done or failed. We can of course chain these futures together with others and do all the usual operations on them.

In our `onSuccess` method we have this:

{% highlight java %}
// Success! We should be able to try making micropayments now. Try doing it 10 times.
for (int i = 0; i < 10; i++) {
    try {
        client.incrementPayment(Utils.CENT);
    } catch (ValueOutOfRangeException e) {
        log.error("Failed to increment payment by a CENT, remaining value is {}", client.state().getValueRefunded());
        System.exit(-3);
    }
    log.info("Successfully sent payment of one CENT, total remaining on channel is now {}", client.state().getValueRefunded());
    Uninterruptibles.sleepUninterruptibly(500, MILLISECONDS);
}
// Now tell the server we're done so they should broadcast the final transaction and refund us what's
// left. If we never do this then eventually the server will time out and do it anyway and if the
// server goes away for longer, then eventually WE will time out and the refund tx will get broadcast
// by ourselves.
log.info("Closing channel!");
client.close();
{% endhighlight %}

So we send 1 bitcent every half a second, and then when we're done we close the channel.


##Choosing channel parameters

To build a payment channel you have to choose a few parameters, notably, how much money you should lock up. Note that on the client side you specify a maximum, and then the server requests the actual amount it is willing to accept in a single channel, so there's no guarantee the total amount the client side specifies will end up in a multi-signature contract. There's no hard and fast rule around what to pick here, it depends on what your app's users are willing to tolerate.

Note that the expiry period for channels is currently unconfigurable - it's always a day.

</div>
