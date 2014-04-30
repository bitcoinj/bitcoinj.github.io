---
layout: base
title: "Working with bitcoinj"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

#Working with bitcoinj

_Common patterns and things you should know._

##Introduction

bitcoinj  uses a few of the following design patterns throughout the code. You can look at the example code in com/google/bitcoin/examples and tools to see how to use the library.

###Futures

We use the Google Guava library and specifically, the [ListenableFuture](http://docs.guava-libraries.googlecode.com/git/javadoc/com/google/common/util/concurrent/ListenableFuture.html) class. `ListenableFuture` is a subclass of the standard JDK Future class and represents some work that is happening in the background which yields a result. When you find yourself with a `ListenableFuture`, you can stop and wait for it to complete, or you can check if it's ready yet, or you can wait with a timeout, or you can register a callback that will be invoked (on some background thread) when the work is done. You may also see regular JDK futures in a few places, these will switch to being `ListenableFutures` over time. 

`ListenableFutures` have a number of benefits due to the addition of completion listeners, for instance it's easy to do fan-in and fan-out waits, you can also chain futures together so work is done one after the other. See the Guava manual for more information.

###Events

Event listeners are usually invoked asynchronously on a dedicated background thread created by the library, called the user thread. This is done for a couple of reasons, one is that it means event listeners run with no locks held and thus there are no re-entrancy restrictions. Another reason is it means you don't have to write thread safe event handlers. 

You can however override this on a per-listener level, most methods have an `addEventListener` or `addListener` method that takes both a listener object and an `Executor` on which it will be invoked. If you're working with frameworks that require thread affinity, for instance a GUI toolkit, then this allows you to automatically marshal callbacks into the correct UI thread.

`ListenableFuture` callbacks can also have an executor specified. You should explicitly specify `Threading.USER_THREAD` if that's what you want.

Starting from 0.11, you can change the `Threading.USER_THREAD` executor to be anything you like, meaning you get to control the execution of event listeners. This is most useful when you want to relay them onto a specific thread instead of the user thread, like in a GUI app. For example:

{% highlight java %}
Threading.USER_THREAD = new Executor() {
  @Override 
  public void execute(Runnable runnable) {
    SwingUtilities.invokeLater(runnable);
  }
};
{% endhighlight %}

The above code snippet run at the start of your app will ensure that bitcoinj callbacks end up running on the GUI thread, meaning they can update widgets and change the GUI in any way they like - simple!

###Serialization

There are three different binary serialization formats used in bitcoinj.

Some classes are serializable using Java serialization. However, as is typical for serializable objects in Java, there is no attempt to preserve long term data compatibility. Thus we don't recommend you use this unless you're shuttling data around temporarily, like on a network.

The Wallet class can be serialized to the [Google protocol buffer format](http://code.google.com/p/protobuf/). This is an extensible, tagged binary format that is easy to work with from many languages. The format is described by a simple language that is compiled into classes for your preferred environment. Protocol buffers are also used for the micropayment protocol.

Finally the proprietary Bitcoin serialization format is supported for anything that subclasses the Message class.

</div>
