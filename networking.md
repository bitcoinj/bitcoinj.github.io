---
layout: base
title: "How to handle networking/peer APIs"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

#How to handle networking/peer APIs

_This article applies to the code in git master only_

##Introduction

The bitcoinj networking APIs have a few options targeted at different use-cases - you can spin up individual Peers and manage them yourself or bring up a `PeerGroup` to let it manage them, you can use one-off sockets or socket managers, and you can use blocking sockets or NIO/non-blocking sockets. This page attempts to explain the tradeoffs and use-cases for each choice, as well as provide some basic examples to doing more advanced networking.

The bitcoinj networking API is built up in a series of layers. On the bottom are simple wrapper classes that provide an API to open new connections using blocking sockets or java NIO (asynchronous select()-based sockets). On top of those sit various parsers that parse the network traffic into messages (ie into the Bitcoin messages). On top of those are `Peer` objects, which handle message handling (exchanging initial version handshake, downloading blocks, etc) for each individual remote peer and provide a simple event listener interface. Finally a `PeerGroup` can be layered on top to keep track of peers, ensuring there are always enough connections to the network and keeping track of network sync progress.

##The simple case

In the case that you simply want a connection to the P2P network (ie in the vast majority of cases), all you need to do is instantiate a PeerGroup and connect a few objects:
{% highlight java %}
PeerGroup peerGroup = new PeerGroup(networkParameters, blockChain);
peerGroup.setUserAgent("Sample App", 1.0);
peerGroup.addWallet(wallet);
peerGroup.addPeerDiscovery(new DnsDiscovery(networkParameters));
peerGroup.startAndWait();
peerGroup.downloadBlockChain();
{% endhighlight %}
After this code completes you've connected to some peers and fully downloaded the blockchain up to the latest block, filling in missing wallet transactions as it goes. peerGroup.startAndWait() and peerGroup.downloadBlockChain() can be replaced with asynchronous versions peerGroup.start() followed by peerGroup.startBlockchainDownload(listener) when the future returned by start() completes.

##Proxying

If you wish to connect to the network using a SOCKS proxy, you must use blocking sockets instead of nio ones. This makes network slightly less efficient, but it should not be noticeable for anything short of very heavy workloads. Then you simply set the Java system properties for a SOCKS proxy (as below) and connections will automatically flow over the proxy. 

{% highlight java %}
System.setProperty("socksProxyHost", "127.0.0.1");
System.setProperty("socksProxyPort", "9050");
peerGroup = new PeerGroup(params, chain, new BlockingClientManager());
{% endhighlight %}

##Experimental: Using Tor

When using Tor, most apps will connect to the network via a local SOCKS proxy. Whilst you could do that as well it has a number of disadvantages, most obviously that you need a local Tor client running already.

With bitcoinj we have a better choice, which is using the [Orchid](http://www.subgraph.com/orchid.html) library - a pure Java implementation of the Tor protocol. Orchid is included in bitcoinj automatically, so you do not have to do anything to benefit from it. However due to performance and reliability concerns Tor is not yet enabled by default, so to use it you must do something like this:

{% highlight java %}
// If using WalletAppKit:
kit.useTor();

// If constructing a PeerGroup by hand:
PeerGroup peerGroup = PeerGroup.newWithTor(params, chain, new TorClient());
{% endhighlight %}

The `TorClient` object can be used to construct new sockets that are routed via Tor, for example, if you wish to use Tor for your own HTTPS requests this is the right way to do that. 

There are some important things to note here. The first is that in 0.12, the Tor support finds peers by building many diverse circuits and querying DNS through all of them. This is very slow but reduces the impact a bad Tor exit can have on peer discovery. In 0.13 things changed such that peers are discovered by a simple, fast HTTP request to a [Cartographer](https://github.com/mikehearn/httpseed) seed. The HTTP response is digitally signed so bad exits cannot tamper with it. This boosts startup performance considerably, at a cost of (temporarily) reduced seed diversity. In future, we hope that more people will run Cartographer seeds and we will combine the strengths of both approaches.

Tor support is likely to get more complete and integrated in future versions of the library.

##Using the lower level API's

You can build a Peer at a lower level, controlling the socket to be used, using code like this:

{% highlight java %}
Peer peer = new Peer(params, bitcoin.chain(), new PeerAddress(InetAddress.getLocalHost(), 8333), "test app", "0.1") {
    @Override
    public void connectionOpened() {
        super.connectionOpened();
        System.out.println("TCP connect done");
    }
};
peer.addEventListener(new AbstractPeerEventListener() {
    @Override
    public void onPeerConnected(Peer peer, int peerCount) {
        System.out.println("Version handshake done");
    }
});
new BlockingClient(address, peer, 10000, SocketFactory.getDefault(), null);
{% endhighlight %}

Of course you would provide your own `SocketFactory` instead of using the default.

If you want access to a raw stream of messages with no higher level logic, subclass `PeerSocketHandler` and override the `processMessage` abstract method. This class implements `StreamParser` which breaks raw byte streams into the right subclass of `Message` for you, and then lets you handle those messages as you see fit. Create instances of your new object and pass them to an implementation of `ClientConnectionManager`, typically either `BlockingClientManager` or `NioClientManager` to use epoll/select based async IO.

</div>
