---
layout: base
title: "How to depend on bitcoinj with Maven using projects"
---

#How to depend on bitcoinj with Maven using projects

[Maven](http://maven.apache.org/) is a plugin based build system from Apache. It supports various other features, like automatically creating a website for your project and resolving dependencies.

If your project uses Maven for its build, you can depend on bitcoinj by adding the following snippet to your pom.xml file in the:

{% highlight xml %}
  <dependencies>
    <dependency>
      <groupId>com.google</groupId>
      <artifactId>bitcoinj</artifactId>
      <version>0.11.1</version>
      <scope>compile</scope>
    </dependency>
  </dependencies>
{% endhighlight %}

Currently you will have to install bitcoinj into your local repo yourself, as it's not yet in Maven Central.

And if you want logging, you can also add

{% highlight xml %}
  <dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-jdk14</artifactId>
    <version>1.6.4</version>
  </dependency>
{% endhighlight %}

This will make bitcoinj log to standard Java logging. You can also make it log to log4j, Android logging, stderr, and other things. Check out the SLF4J framework to learn more.

To get bitcoinj you can use git and check out your own copy:

~~~
git clone https://code.google.com/p/bitcoinj/ bitcoinj
cd bitcoinj
git fetch --all
git checkout 95abd140f016ec89e84c05b1469d57b4def7badf
mvn install
~~~

This will give you v0.11.1. If PGP is your thing, you can run `git tag -v v0.11.1` to check Andreas Schildbach's signature of the release.
