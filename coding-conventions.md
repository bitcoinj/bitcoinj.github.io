---
layout: base
title: "Coding conventions in bitcoinj"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

# Coding conventions in bitcoinj

This article discusses various conventions and style rules that bitcoinj uses. If you want to contribute to the project, please read and understand this document first.

## Coding style

We use the standard coding style from Sun, but pay attention to the following rules:

Code is vertically dense, blank lines in methods are used sparingly. This is so more code can fit on screen at once.

We try to avoid lines going beyond 120 columns. However this is not a hard and fast rule. Content that is typically not very important like throws declarations are allowed to spill over if it results in more vertically dense code. Logic and comments should fit though.

Each file has a copyright notice at the top. You should put your own name there, unless you work for Google, in which case please put Google's name there instead. We do not mark classes with @author annotations, we have an AUTHORS file in the top level instead.

## Comments

We like them as long as they add detail that is missing from the code. Comments that simply repeat the story already told by the code are best deleted. Comments should:

* Explain **what** the code is doing at a higher level than is obtainable from just examining the statement and surrounding code.
* Explain **why** certain choices were made and the tradeoffs considered.
* Don't be afraid of **redundancy**, many people will start reading your code in the middle with little or no idea of what it's about, eg, due to a bug or a need to introduce a new feature. It's OK to repeat basic facts or descriptions in different places if that increases the chance developers will see something important.
* Explain **how things can go wrong**, which is a detail often not easily seen just by reading the code.
* Use good grammar with capital letters and full stops. This gets us in the right frame of mind for writing real explanations of things.

JavaDocs: all public methods, constants and classes should have JavaDocs. JavaDocs should:

* Explain what the method does **in words different to how the code describes it**
* Always have some text, annotation-only JavaDocs don't render well. Write "Returns a blah blah blah" rather than "@returns blah blah blah".
* Illustrate with examples when you might want to use the method or class. Point the user at alternatives if this code is not always right.
* Make good use of {@link} annotations.

Bad JavaDocs look like this:

{% highlight java %}
   /** @return the size of the Bloom filter. */
   public int getBloomFilterSize() {
       return block;
   }
{% endhighlight %}

Good JavaDocs look like this:

{% highlight java %}
   /**
    * Returns the size of the current {@link BloomFilter} in bytes. Larger filters have 
    * lower false positive rates for the same number of inserted keys and thus lower privacy, 
    * but bandwidth usage is also correspondingly reduced.
    */
   public int getBloomFilterSize() { ... }
{% endhighlight %}

## Threading

All bitcoinj code is thread safe by default, exceptions are marked. Objects that have event listeners should allow users to specify an executor and then use it. If no executor is specified then `Threading.USER_THREAD` should be used, this is an executor that marshals runnables onto a background thread. Sometimes library internal event handlers can use `Threading.SAME_THREAD` however they must be written carefully to avoid lock inversions.

Event listeners are stored using CopyOnWriteArrayLists so they can be modified concurrently with execution (when they run in the same thread), in particular, this means that listeners can add or remove more listeners during their own execution without problems. We use Guava cycle detecting locks to find cases where locks get accidentally inverted, which is almost always due to chains of event listeners. Prefer bitcoinj `Threading.lock` to the use of synchronized statements where possible. `Threading.lock` performs cycle detection whereas Java language level locks don't.

We make use of volatile variables for references and booleans. For integers we use AtomicInteger. Variables that can be accessed by multiple threads should be marked as volatile and named with a v prefix, ie "thingiesPerSecond" becomes "vThingiesPerSecond". This is so when you read the bodies of methods that are thread safe, you can quickly spot class member variables that are not volatile.

## Static analysis

We like IntelliJ Inspector. It can find similar bugs to FindBugs but with the advantage that it runs constantly in the background and seems to support a wider range of issues. We use annotations like `@GuardedBy` to help detect cases where variables aren't being properly locked, although the inspection for that isn't perfect by any means. We also use `@Override` and `@VisibleForTesting`.

We use nullity annotations. Field members and method parameters are assumed to not contain null by default, and cases where they can are marked with `@Nullable`. This allows static analysis engines like the Inspector to flag cases where we're possibly dereferencing a null pointer.

## Assertions

We don't use the Java assert keyword, we use the Guava Preconditions class instead. The reason is that enabling assertions on Dalvik is a bit annoying and they are typically disabled in the field. However, we want assertions to always be enabled, even in production, because they are sometimes checking security sensitive matters.

We statically import Preconditions whenever it's used, so we can write code like this:

{% highlight java %}
checkState(foo, "Object is not in the right state");
checkArgument(widget.isActive(), "This method requires an active widget");
Bar bar = checkNotNull(foo.bar);
{% endhighlight %}

You will see checkNotNull not only verifying arguments but used in other places too. This is typically done in order to prove to IntelliJ Inspector that a variable cannot be null at that point in time due to complex logic it can't figure out by itself (it knows how to read if statements in the same method and similar). This allows us to clear static analysis warnings that would otherwise flag a possible nullity violation.

## Java

We target Java 6. This is because that's the version supported by Android phones. Due to our desire to make Bitcoin universally usable, we want to support developing countries where even new phones ship with Gingerbread for cost reasons. Therefore it will be a long time until we can use any JDK7 features that require runtime support, as Java 7 started being supported only with Android KitKat. Fortunately smart IDE's can take away most of the painful parts of working with Java 6.

We make minimal use of fancy tricks like code synthesis or reflection. Thus we also avoid frameworks that rely on them too. One reason is to keep things simple and readable, another reason is to avoid closing doors to things like trans-compilation into other languages or aggressive dead code elimination.

</div>
