var https = require('https'),
    querystring = require('querystring');
  var USER = 'david.p_api1.casamiento-cards.co.uk',
    PWD = 'WZFA2LEYHLMVS8GC',
    SIGNATURE = 'AFcWxV21C7fd0v3bYYYRCpSSRl31AGarkFSt5jUYyxNcPfou1CUmwV3u';

module.exports = Api;
function Api(user, pwd, signature) {
    this.user = user;
    this.pwd = pwd;
    this.signature = signature;

    this.authenticateString = "&VERSION=86.0" + "&USER=" + this.user + "&PWD=" + this.pwd + "&SIGNATURE=" + this.signature;
}

Api.prototype.buildQuery = function buildQuery(method, callback, obj) {
    var query = "METHOD=" + method + this.authenticateString;
    for (var key in obj) {
        query += "&" + key.toUpperCase();
        query += '=' + obj[key];
    }

    var query = encodeURI(query)

    var options = {
        host: 'api-3t.paypal.com',
        port: 443,
        path: "/nvp",
        method: 'POST',
        headers: {
            'Content-length': query.length
        }
    }

    var req = https.request(options, function(res) {
        var result = "";
        res.on('data', function(chunk) {
            result += chunk;
        });
        res.on('end', function() {
            result = querystring.parse(result);
            if (result["ACK"] == 'Failure') {
                callback(result, null);
            }
            else {
                var objects = []
                var parsedResult = {}
               for(var key in result) {
                    if(isNaN((key[key.length-1] / 1))) {
                        parsedResult[key] = result[key]
                    }
                    else {
                       var matches = key.match(/(\d+)$/)
                       var id = matches[0];
                       objects[id] = objects[id] || {}
                       var truncatedKey = key.substring(0,key.length-id.length);
                       objects[id][truncatedKey] = result[key];                       
                    }
                }
                parsedResult[method + "Response"] = objects;
                callback(null, parsedResult);
            }
        });
    });
    req.write(query);
    req.end();

    req.on('error', function(e) {
        callback(e);
    });
    return query;
}


//var api = new Api(USER,PWD,SIGNATURE);
//api.buildQuery("GetBalance", function(e, r) { console.log(r)} , { returnallcurrencies: 1 });