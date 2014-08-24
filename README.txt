
## Certificate generation

$ keytool -genkey -keystore ./netshot_keystore -alias serverKey -dname "CN=localhost, OU=Netshot, O=Netshot, C=FR"
$ keytool -export -alias serverKey -rfc -keystore ./netshot_keystore > ./server.cert

$ make-ssl-cert /usr/share/ssl-cert/ssleay.cnf proxy.pem

## Netfilter port redirection

iptables -t nat -A PREROUTING -i tap0 -p udp --dport 69 -j REDIRECT --to-port 1069


## Apache configuration example

<VirtualHost *:80>
        ServerAdmin webmaster@localhost
        DocumentRoot /var/www
        <Directory />
                Options FollowSymLinks
                AllowOverride None
        </Directory>
        RewriteEngine On
        RewriteCond %{HTTPS} off
        RewriteRule ^(/netshot/).* https://%{HTTP_HOST}/netshot

</VirtualHost>

<VirtualHost *:443>
        ServerAdmin webmaster@localhost

        SSLEngine on
        SSLCertificateFile /home/sylv/workspace/netshot/proxy-serverside.pem
        SSLProxyEngine on

        DocumentRoot /var/www
        <Directory />
                Options FollowSymLinks
                AllowOverride None
        </Directory>
        <Directory /var/www/>
                Options Indexes FollowSymLinks MultiViews
                AllowOverride None
                Order allow,deny
                allow from all
        </Directory>

        ProxyPass /netshot/rs http://127.0.0.1:9996/netshot retry=0
        ProxyPassReverse /netshot/rs http://127.0.0.1:9996/netshot
        ProxyRequests Off

        ErrorLog ${APACHE_LOG_DIR}/error.log

        # Possible values include: debug, info, notice, warn, error, crit,
        # alert, emerg.
        LogLevel warn

        CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>


## Netshot default user

Username: netshot
Password: netshot
SQL statement:
INSERT INTO user (level, local, username, hashed_password) VALUES (1000, 1, 'netshot', '7htrot2BNjUV/g57h/HJ/C1N0Fqrj+QQ');


## Netshot script examples

function findBlocks(pattern, text) {
    var source = pattern.source;
    var r = new RegExp("(?:^|\\n)(\\s*)(" + source + ")(((?:\\r?)\\n\\1\\s.*)*)", "g");
    var blocks = [];
    while ((block = r.exec(text)) !== null) {
        blocks.push(block);
    }
    return blocks;
}



function check() {
	//var config = Netshot.get('config');
	//var name = Netshot.get('name');
	var interfaces = Netshot.get('interfaces');
	for (var i in interfaces) {
	    //Netshot.debug(interfaces[i]);
	}
	var lookup = Netshot.nslookup("www.google.com");
	Netshot.debug(lookup);
	return {
	    result: CONFORMING,
	    comment: "My comments"
	};
	//return NONCONFORMING;
	//return NOTAPPLICABLE;
}

function check() {
    var ref = Netshot.get("config", 2899);
    Netshot.debug(ref);
    return CONFORMING;
}
