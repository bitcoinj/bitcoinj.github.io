---
layout: base
title: "Getting started in Javascript"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

## Initial setup

Java 8 ships with a Javascript engine called Nashorn that has performance approaching that of V8 (it's not quite as good, but good enough). It's easy to use Java code using this engine, and Javascript programs can be run from the command line or using an interactive interpreter. There are also projects that provide a node.js compatible API, but this tutorial will not explore those.

To get started, grab version 8 of the JDK and make sure you can run the "jjs" tool. Next, download [the bundled bitcoinj JAR from Maven Central](http://search.maven.org/remotecontent?filepath=org/bitcoinj/bitcoinj-core/0.14.6/bitcoinj-core-0.14.6-bundled.jar) and put it into your working directory. That's all we need to start using bitcoinj from Javascript.

Now let's take a look at [the demo.js file from the examples](https://github.com/bitcoinj/bitcoinj/blob/master/examples/src/main/javascript/demo.js) in the source tree. The demo program does a few basic things like creating a key and printing its address, and then brings up the network and prints some info about the peers it got connected to.

## Running the demo

To run a program that uses bitcoinj in Javascript one can simply execute:

```
jjs -cp bitcoinj-0.14.6-bundled.jar demo.js
```

This runs the program in Nashorn. Note that Nashorn supports some extra stuff that isn't present in web-style Javascript, like the ability to import code from Java libraries. The "cp" command line argument sets the class path: it's a list of JARs (java libraries). In this case we're just telling it to load the bundled version of bitcoinj, which includes the library and all its dependencies together.

You'll get a warning from SLF4J about not having any logging backend. That's OK. We can look at how to set up logging later. For now let's just examine the code.

## demo.js

{% highlight js %}
// Import some stuff.
var bcj = org.bitcoinj;
var ECKey = bcj.core.ECKey;

// We'll use the testnet for now.
var params = bcj.params.TestNet3Params.get();

// Most basic operation: make a key and print its address form to the screen.
var key = new ECKey();
print(key.toAddress(params));

// Keys record their creation time. Java getFoo()/setFoo() style methods can be treated as js properties:
print(key.creationTimeSeconds);
key.creationTimeSeconds = 0;
{% endhighlight %}

The first part of this file is very straightforward. Nashorn reflects Java libraries into the Javascript namespace automatically, but we alias org.bitcoinj to just bcj here to make the code less verbose. We can also alias individual classes and so on. Then we fetch the "network parameters", this controls whether we are working with the main Bitcoin network or the test network (or regtest mode on a local node). The parameters object is passed to many APIs in bitcoinj.

Next up, we create a key, and show how to print its address.

To learn what APIs are available, you can browse the online javadocs. Obviously, these are intended for Java developers. However translating the API to Javascript is easy. At the end we see a convenience that Nashorn provides:  where Java would require you to call getFoo() or setFoo("foo") methods, in Javascript we can treat these as regular properties on the object. Much better.

{% highlight js %}
// Let's connect to the network. This won't download the block chain.
var PeerGroup = bcj.core.PeerGroup;
var pg = new PeerGroup(params)
pg.addPeerDiscovery(new bcj.net.discovery.DnsDiscovery(params));
pg.startAsync();
pg.awaitRunning();

// Wait until we have at least three peers.
print("Waiting for some peers")
pg.waitForPeers(3).get()
print("Connected to: " + pg.connectedPeers);
{% endhighlight %}

This piece of code shows how to get connected to the P2P network. A `PeerGroup` manages multiple peer connections. We have to configure it with a DNS discovery instance and then make it start. It will find and set up connections in the background. The last line waits for it to find at least three connected peers and then prints out their IP addresses and ports. The `connectedPeers` property gives a list of `Peer` objects.

## A note on asynchronicity

Javascript was developed for web browsers, which are a single threaded environment, and as such Javascript has no ability to create threads, nor is V8 (the most popular JS runtime) thread safe. Instead most JS environments give you only a style of threading that dates from the Visual Basic era - you can run parallel javascript engines that can communicate via message passing only. This in turn implies that you cannot ever block, leading to a heavily callback oriented style of programming.

In contrast, Nashorn compiles Javascript to bytecode that runs on the JVM. As a result it is fully thread safe. Whilst you can certainly implement pure message passing with lots of callbacks if you want to, you aren't forced to and can do concurrent programming in a multi-paradigm fashion.

Here, we are taking the simple route: we're just blocking the main thread when we need to wait for something to happen. Below, we'll see how to do things asynchronously. The `waitForPeers(3)` method returns a *future* that will complete once we have at least three peers. Futures are sometimes called promises in the Javascript world. Calling their `get` method blocks until the future's result is ready.

## Iterating over collections and arrays

The `pg.connectedPeers` property is a Java collection. This is treated like a Javascript array by Nashorn. But because Javascript has historically not had a convenient way to iterate over a collection, Nashorn extends the language with a Java-like foreach statement. We can use it here:

{% highlight js %}
var connectedPeers = pg.connectedPeers;
for each (var peer in connectedPeers)
    print(peer.peerVersionMessage.subVer);

// which for me outputs this:
// /Satoshi:0.9.99/
// /Satoshi:0.9.2/
// /Satoshi:0.9.1/

// Of course we can do it the old JS way too:
for (var i = 0; i < connectedPeers.length; i++) {
    print("Chain height for " + connectedPeers[i] + " is " + connectedPeers[i].bestHeight)
}
{% endhighlight %}

The "subVer" field of a Peer is the bitcoin equivalent of an HTTP user agent string. The "bestHeight" field is the self-reported (unauthenticated) chain height that the peer claims to be on.

You can of course, also use the more modern JS style foreach that uses a closure, which is naturally less efficient:

{% highlight js %}
// or slightly more modern js:
connectedPeers.forEach(function(peer) {
    peer.ping().get();
    print("Ping time for " + peer + " is " + peer.lastPingTime);

    // The get() call above forced the program to wait for the ping. Peers are pinged in the background and the ping
    // times averaged, but if we didn't wait here we might not get a realistic ping time back because the program only
    // just started up.
});
{% endhighlight %}

Here we can see that we're blocking again and measuring the ping time to the remote peer. Note that this is not an ICMP (internet level) ping, but rather a Bitcoin protocol specific ping message.

Let's do that again, but this time in an async way:

{% highlight js %}
var futures = [];
connectedPeers.forEach(function(peer) {
    var future = peer.ping();
    futures.push(future);

    future.addListener(function() {
        var pingTime = future.get();
        print("Async callback ping time for " + peer + " is " + pingTime);
    }, bcj.utils.Threading.USER_THREAD);
});

// Just wait for all the pings here by calling get again ...
futures.forEach(function(f) { f.get() });
print("Done!");
{% endhighlight %}

Here we start a ping for each peer and add the returned future to the array. Then we add a closure that will run when the future completes. Note the final (required) parameter: it says which thread to run the closure in. Here we are specifying the 'user thread', which is a dedicated thread created by bitcoinj that hangs around waiting to run event handlers. By making things run in the user thread, you can be sure your own event handlers won't end up running in parallel to each other (although they can still run in parallel to the main thread!). Once the future listener runs, we can get the result as normal safe in the knowledge that it won't block.

The last forEach loop simply keeps the program running until all the pings have responses.

## Where to go from here?

There are many other features in bitcoinj that this tutorial does not cover. You can read the other articles to learn more about full verification, wallet encryption and so on, and of course the JavaDocs detail the full API. 

There is another Javascript example that implements the same forwarding program as the Java tutorial, [forwarding.js](https://github.com/bitcoinj/bitcoinj/blob/master/examples/src/main/javascript/forwarding.js). You can read that program to learn how to use the wallet and how to receive and send money.

Have fun and if you have any questions, find us on IRC or the mailing list.

</div>
