var express=require('express'),
bodyParser = require('body-parser'),
mysql=require('mysql'),
credentials=require('./credentials.json'),
app = express(),
port = process.env.PORT || 1337;

var Promise = require('bluebird');
var using = Promise.using;
Promise.promisifyAll(require("mysql/lib/Connection").prototype);
Promise.promisifyAll(require("mysql/lib/Pool").prototype);

credentials.host='ids.morris.umn.edu'; //setup database credentials
var databaseName = "schr1230";

// Created a connection pool
connectionPool = mysql.createPool(credentials); // setup the connection

//
var getConnection = function(){
  return connectionPool.getConnectionAsync().disposer(
    function(connection){return connection.release();}
  );
};

var query = function(command){
  return using(getConnection(), function(connection)
    {
      return connection.queryAsync(command);
    }); 
};

app.use(bodyParser.json()); //for parsing application/json

// Attempts to resolve all get requests by reading from /public before
// trying other routes
app.use(express.static(__dirname + '/public'));

// ---------------------------------------------------------------------
// The desired behaviours of the following routes is described in api.md
// ---------------------------------------------------------------------

var archiveTransaction = function(voided) {
  return query(mysql.format("INSERT INTO ??.transactions_archive (voided, user, first_timestamp, last_timestamp) values(?, NULL, (SELECT min(timestamp) from ??.transaction_time), (SELECT max(timestamp) from ??.transaction_time))", [databaseName, voided, databaseName, databaseName]))
    .then(function(result){
      tid = result.insertId;
      return query(mysql.format("SELECT * FROM ??.current_transaction_view", databaseName));
    })
    .then(function(results){
      results = results.map(function(row){
        return "(" + tid + ", " + mysql.escape(row.item) + ", " + row.count + ", " + (row.price * row.count) + ")";
      });
      var resultString = results.join(",");
      return query(mysql.format("INSERT INTO ??.transaction_items_archive (tid, item, count, subtotal) values" + resultString, databaseName));
    })
    .then(function(){
      return query(mysql.format("TRUNCATE ??.transaction", databaseName));
    })
    .then(function(){
      return query(mysql.format("TRUNCATE ??.transaction_time", databaseName));
    });
}

app.get("/buttons",function(req,res){
  var sql = mysql.format('SELECT buttonID,`left`,top,width,invID,item AS label FROM ??.till_buttons,??.inventory WHERE invID = id', [databaseName,databaseName]);
  query(sql).then(function(rows){
    res.send(rows);
  }).catch(function(err){
    console.log("Error in 'GET /buttons':");
    console.log(err);
    res.sendStatus(500);
  });
});

app.get("/transaction" , function(req,res) {
  query("SELECT itemId,count(itemId) AS count,price, item FROM "+databaseName+ ".transaction," +databaseName+ ".prices," +databaseName+ ".inventory"+
                       " WHERE prices.id=itemId AND itemId=inventory.id GROUP BY itemId;").then(function(rows) {
    res.send(rows);
  }).catch(function(err){
    console.log("Error in 'GET /transaction':");
    console.log(err);
    res.sendStatus(500);
  });
});

app.delete("/transaction/:itemId", function(req, res){
  var itemId = req.params.itemId;
  query(mysql.format("DELETE FROM ??.transaction WHERE itemId = ?", [databaseName, itemId])).then(function(result){
      if(result.affectedRows == 0) {
        res.sendStatus(404); // Can't delete nonexistent items
      } else {
        query(mysql.format("INSERT INTO ??.transaction_time (timestamp,action) VALUES (CURRENT_TIME() , 'deleted')", databaseName))
          .then(function(result) {
            res.send('');
          });
      }
  }).catch(function(err){
    console.log("Error in 'DELETE /transaction/:itemId':");
    console.log(err);
    res.sendStatus(500);
  });
});

app.delete("/transaction" , function(req, res) {
    archiveTransaction(true)
    .then(function() {
      res.send('');
    }).catch(function(err){
      console.log("Error in 'DELETE /transaction':");
      console.log(err);
      res.sendStatus(500);
    });
});

app.post("/transaction", function(req,res) {
  if (req.body["action"] == "commit sale") {
    // TODO: we don't actually reduce the counts in `inventory` when selling items
    archiveTransaction(false)
    .then(function(){
      res.send('');
    }).catch(function(err){
      console.log("Error in 'POST /transaction':");
      console.log(err);
      res.sendStatus(500);
    });
  } else {
    res.sendStatus(400);
  }
});

app.post("/transaction/:itemId" , function(req,res) {
  var itemId = req.params.itemId;
  query(mysql.format("INSERT INTO ??.transaction value(?)", [databaseName, itemId]))
    .then(function(result) {
      query(mysql.format("INSERT INTO ??.transaction_time (timestamp,action) VALUES (CURRENT_TIME() , 'clicked')", databaseName))
        .then(function(result) {
          res.send('');
        });
    }).catch(function(err){
      console.log("Error in 'POST /transaction/:itemId':");
      if(err.code == 'ER_NO_REFERENCED_ROW_2'){
        console.log("Invalid Item ID");
        res.status(400).send('Invalid Item ID');
      } else {
        console.log(err);
        res.sendStatus(500); 
      }
    });
});

app.listen(port);
