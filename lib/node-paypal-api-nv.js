var https = require('https'),
    querystring = require('querystring');

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
        var objects = [],
            parsedResult = {},
            errors = [],
            matches;
        // NEED TO HANDLE ERRORS L_SHORTMESSAGE0
        for (var key in result) {
          matches = key.match(/^L_.*?(\d+)/);
          if (matches == null) {
            parsedResult[key] = result[key]
          }
          else {
            var id = matches[1];

            var error = key.match(/(SHORTMESSAGE|LONGMESSAGE|ERRORCODE|SEVERITYCODE)/);
            if (error) {
              errors[id] = errors[id] || {}
              var truncatedKey = key.substring(0, key.length - id.length)
              errors[id][truncatedKey] = result[key]
            }
            else {
              objects[id] = objects[id] || {}
              var truncatedKey = key.substring(0, key.length - id.length);
              objects[id][truncatedKey] = result[key];
            }
          }
        }
        parsedResult[method + "Response"] = objects;
        parsedResult[method + "ResponseErrors"] = errors;
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