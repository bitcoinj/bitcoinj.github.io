///usr/bin/env java "$0" "$@" ; exit $?
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpHandlers;
import com.sun.net.httpserver.SimpleFileServer;
import java.net.InetSocketAddress;
import java.nio.file.Path;

static final int port = 4000;

public static void main(String[] args) {
    Path root = Path.of("./_site").toAbsolutePath();

    // Create the default file handler
    var fileHandler = SimpleFileServer.createFileHandler(root);

    // This handler checks if we need to append .html internally
    HttpHandler rewritingHandler = exchange -> {
        String path = exchange.getRequestURI().getPath();

        // If path is not root, doesn't have a dot, and doesn't end in a slash
        if (!path.equals("/") && !path.contains(".") && !path.endsWith("/")) {
            String newPath = path + ".html";

            // We wrap the exchange to override the Request URI
            // The file handler will now look for "name.html" on disk
            fileHandler.handle(new WrappedExchange(exchange, newPath));
        } else {
            fileHandler.handle(exchange);
        }
    };

    // Start the server
    var server = SimpleFileServer.createFileServer(
            new InetSocketAddress(port),
            root,
            SimpleFileServer.OutputLevel.INFO
    );

    // Replace the default context with our custom handler
    server.removeContext("/");
    server.createContext("/", rewritingHandler);

    System.out.printf("Serving Jekyll site at http://localhost:%s\n", port);
    server.start();
    IO.println("Use Control-C to cancel");
}

// Helper class to "trick" the file handler into looking for a different path
static class WrappedExchange extends HttpExchange {
    private final HttpExchange delegate;
    private final URI interceptedUri;

    WrappedExchange(HttpExchange delegate, String newPath) {
        this.delegate = delegate;
        this.interceptedUri = delegate.getRequestURI().resolve(newPath);
    }

    @Override public URI getRequestURI() { return interceptedUri; }
    // Delegate all other methods
    @Override public com.sun.net.httpserver.Headers getRequestHeaders() { return delegate.getRequestHeaders(); }
    @Override public com.sun.net.httpserver.Headers getResponseHeaders() { return delegate.getResponseHeaders(); }
    @Override public String getRequestMethod() { return delegate.getRequestMethod(); }
    @Override public void sendResponseHeaders(int rCode, long responseLength) throws java.io.IOException { delegate.sendResponseHeaders(rCode, responseLength); }
    @Override public java.io.InputStream getRequestBody() { return delegate.getRequestBody(); }
    @Override public java.io.OutputStream getResponseBody() { return delegate.getResponseBody(); }
    @Override public void close() { delegate.close(); }
    @Override public InetSocketAddress getRemoteAddress() { return delegate.getRemoteAddress(); }
    @Override public int getResponseCode() { return delegate.getResponseCode(); }
    @Override public InetSocketAddress getLocalAddress() { return delegate.getLocalAddress(); }
    @Override public String getProtocol() { return delegate.getProtocol(); }
    @Override public Object getAttribute(String name) { return delegate.getAttribute(name); }
    @Override public void setAttribute(String name, Object value) { delegate.setAttribute(name, value); }
    @Override public void setStreams(java.io.InputStream i, java.io.OutputStream o) { delegate.setStreams(i, o); }
    @Override public com.sun.net.httpserver.HttpContext getHttpContext() { return delegate.getHttpContext(); }
    @Override public com.sun.net.httpserver.HttpPrincipal getPrincipal() { return delegate.getPrincipal(); }
}