# How to create HTTPS certificates

This repo uses [express](https://www.npmjs.com/package/express) and [openssl](https://www.openssl.org/) to create local https server, that serves also static file assets.

[How to Create Trusted Self-Signed SSL Certificates and Local Domains for Testing](https://betterprogramming.pub/trusted-self-signed-certificate-and-local-domains-for-testing-7c6e6e3f9548)

## Self-Signed Certificate

A self-signed certificate is a certificate that’s signed by the person creating it rather than a trusted certificate authority. The development servers can be enabled with self-signed certificates that’ll help us reduce the certificate cost and also the management overheads.

By default, the self-signed certificate throws a certificate-validation error when accessing the websites in browsers but will allow us to proceed to the actual pages by accepting the risk. In some cases, the self-signed certificates won’t help us test some of the browser functionalities that only work through valid SSL — e.g., testing different browsers’ APIs, like geolocation.

Let’s now see how to quickly set up the local domains and a trusted self-signed certificate for testing in Windows. the same can be used in other systems with some additional steps.

## Local Domains

Sometimes we may need to have different domains to test our application in the development environment. The DNS setup will consume more time and cost; the local domains help us to test the applications quickly in development environments.

I’m going to define the following test domains — ```myexample.com```, ```sub.myexample.com```, and ```myexample1.com```.

Edit the Windows hosts file, `C:\Windows\System32\drivers\etc\hosts`. Add the below entries to map the test domains to `127.0.0.1` so the defined domains will be able to access the application running on the localhost within the same machine.

```sh
127.0.0.1 myexample.com 
127.0.0.1 sub.myexample.com 
127.0.0.1 myexample1.com
```

Let’s now create a self-signed certificate through OpenSSL.

## Generate a Root SSL Certificate

Create an RSA-2048 key, and save it to the file rootCA.key.

```sh
openssl genrsa -des3 -out rootCA.key 2048
```

When you get “Enter passphrase for rootCA.key,” enter a passphrase and store it securely.

Create a root certificate through the key generated.

```sh
openssl req -x509 -new -nodes -key rootCA.key -sha256 -days 1460 -out rootCA.pem
```

Change the validity days as needed.

When you get “Enter passphrase for rootCA.key,” enter the passphrase used while generating the root key.

Enter the other optional information:

- Country Name (2 letter code) [AU]: US
- State or Province Name (full name) [Some-State]: MN
- Locality Name (e.g., city) []: Eagan
- Organization Name (e.g., company) [Internet Widgits Pty Ltd]: Tech Forum
- Organizational Unit Name (e.g., section) []: Marketing
- Common Name (e.g., server FQDN or YOUR name) []: Local certificate
- Email Address []: admin@techforum.com

# Trust the Root SSL Certificate:

Now the root certificate is ready. Let’s trust the root SSL certificate in the local system.

Run the below command through the command prompt <span style="color: red;">(run through elevated admin access)</span>:

```sh
certutil -addstore -f "ROOT" rootCA.pem
```

Now the root certificate is added as part of the Trusted Root Certification Authorities.

![https://miro.medium.com/v2/resize:fit:4800/format:webp/1*HVlPBeSKLJGF4H6bUEhpxA.png](https://miro.medium.com/v2/resize:fit:4800/format:webp/1*HVlPBeSKLJGF4H6bUEhpxA.png)

You can verify the certificate through Certificate Manager or `Certmgr.msc`.

![https://miro.medium.com/v2/resize:fit:4800/format:webp/1*qPKX6ScawwZGZ4aDqhv-ow.png](https://miro.medium.com/v2/resize:fit:4800/format:webp/1*qPKX6ScawwZGZ4aDqhv-ow.png)

Even the root certificate can be managed through browsers: In Chrome, navigate to Settings → Privacy and Security → Security → Manage Certificates → Trusted Root Certification Authorities.

You can import/export and remove the certificate (the certificates can’t be removed if it was imported through `Certmgr.msc`):

![https://miro.medium.com/v2/resize:fit:4800/format:webp/1*t9fai9OIxdthY2tBolzhfA.png](https://miro.medium.com/v2/resize:fit:4800/format:webp/1*t9fai9OIxdthY2tBolzhfA.png)

# Generate an SSL SAN Certificate With the Root Certificate

The root certificate is trusted now. Let’s issue an SSL certificate to support our local domains — myexample.com, sub.myexample.com, myexample1.com, and localhost for testing.

Even the root certificate can be managed through browsers: In Chrome, navigate to Settings → Privacy and Security → Security → Manage Certificates → Trusted Root Certification Authorities.

You can import/export and remove the certificate (the certificates can’t be removed if it was imported through `Certmgr.msc`):

![https://miro.medium.com/v2/resize:fit:4800/format:webp/1*t9fai9OIxdthY2tBolzhfA.png](https://miro.medium.com/v2/resize:fit:4800/format:webp/1*t9fai9OIxdthY2tBolzhfA.png)

# Generate an SSL SAN Certificate With the Root Certificate

The root certificate is trusted now. Let’s issue an SSL certificate to support our local domains — `myexample.com`, `sub.myexample.com`, `myexample1`.com, and localhost for testing.

Create a new OpenSSL configuration file server.csr.cnf so the configurations details can be used while generating the certificate.


```sh
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn

[dn]
C=US
ST=MN
L=Eagan
O=Tech Forum
OU=Marketing
emailAddress=admin@techforum.com
CN = localhost
```

Create a `v3.ext` file with a list of local SAN domains:

```sh
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names
[alt_names]
DNS.1 = myexample.com
DNS.2=sub.myexample.com
DNS.3=myexample1.com
DNS.4=localhost
```

Create a private key and certificate-signing request (CSR) for the localhost certificate.

```sh
openssl req -new -sha256 -nodes -out server.csr -newkey rsa:2048 -keyout server.key -config server.csr.cnf
```

This private key is stored on `server.key`

Let’s issue a certificate via the root SSL certificate and the CSR created earlier.

```sh
openssl x509 -req -in server.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out server.crt -days 500 -sha256 -extfile v3.ext
```

When it says “Enter passphrase for rootCA.key,” enter the passphrase used while generating the root key.

The output certificate is stored in a file called `server.crt`

# Enable the SSL Certificate for the Local Server

Let’s now enable the certificate for the local server. I’m going to configure the certificate with the Express.js application to enable the trusted SSL communication.

**app.js**

```js
var express = require('express')
const path = require('path')
const https = require('https');
const fs = require('fs');
var app = express ()
app.get('/index.html', function (req, res) {
res.sendFile('index.html', {
        root: path.join(__dirname, '.')
    })
})
https.createServer({
  key: fs.readFileSync('ssl\\server.key'),
  cert: fs.readFileSync('ssl\\server.crt')
}, app)
.listen(443, function () {
  console.log('Example app listening on port 443! Go to https://localhost/')
})
```

Now the certificate is trusted from the browser for the test domains
`myexample.com`, `sub.myexample.com`, `myexample1.com`, and `localhost`.

![https://miro.medium.com/v2/resize:fit:4800/format:webp/1*-Dgb3TjiRch84a7Ly4GEEg.png](https://miro.medium.com/v2/resize:fit:4800/format:webp/1*-Dgb3TjiRch84a7Ly4GEEg.png)

