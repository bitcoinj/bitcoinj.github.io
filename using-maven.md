---
layout: base
title: "How to depend on bitcoinj with Maven using projects"
---

# How to depend on bitcoinj with Maven using projects

[Maven](http://maven.apache.org/) is a plugin based build system from Apache. It supports various other features, like automatically creating a website for your project and resolving dependencies.

If your project uses Maven for its build, you can depend on bitcoinj by adding the following snippet to your pom.xml file in the:

{% highlight xml %}
  <dependencies>
    <dependency>
      <groupId>org.bitcoinj</groupId>
      <artifactId>bitcoinj-core</artifactId>
      <version>0.15.10</version>
      <scope>compile</scope>
    </dependency>
  </dependencies>
{% endhighlight %}

To get the source you can also use git and check out your own copy:

~~~
git clone https://github.com/bitcoinj/bitcoinj.git
cd bitcoinj
git fetch --all
git checkout v0.15.10
mvn install
~~~

This will give you v0.15.10. If PGP is your thing, you can run `git tag -v v0.15.10` to check Andreas Schildbach's signature of the release.
