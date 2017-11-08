var express=require('express'),
mysql=require('mysql'),
credentials=require('./credentials.json'),
app = express(),
port = process.env.PORT || 1337;

credentials.host='ids.morris.umn.edu'; //setup database credentials
var databaseName = "schr1230";

// Created a connection pool
connectionPool = mysql.createPool(credentials); // setup the connection

// Attempts to resolve all get requests by reading from /public before
// trying other routes
app.use(express.static(__dirname + '/public'));

// ---------------------------------------------------------------------
// The desired behaviours of the following routes is described in api.md
// ---------------------------------------------------------------------


app.get("/buttons",function(req,res){
  var sql = mysql.format('SELECT buttonID,`left`,top,width,invID,item AS label FROM ??.till_buttons,??.inventory WHERE invID = id', [databaseName,databaseName]);
  connectionPool.query(sql,(function(res){return function(err,rows,fields){
    if(err) {
      console.log("Error: ?", err);
      res.sendStatus(500);   // If any error occurs, it is probably not the client's fault
    } else {
      res.send(rows);
    }
  }})(res));
});

app.get("/transaction" , function(req,res) {
  connectionPool.query("SELECT itemId,count(itemId) AS count,price, item FROM "+databaseName+ ".transaction," +databaseName+ ".prices," +databaseName+ ".inventory"+
			" WHERE prices.id=itemId AND itemId=inventory.id GROUP BY itemId;", function(err,rows,field) {
    if(err) {
      console.log("Error: ?", err);
      res.sendStatus(500);  // If any error occurs, it is probably not the client's fault
    } else {
      res.send(rows);
    }
  });
});

app.delete("/transaction/:itemId", function(req, res){
  var itemId = req.params.itemId;
  connectionPool.query(mysql.format("DELETE FROM ??.transaction WHERE itemId = ?", [databaseName, itemId]), function(err, rows, fields){
    if(err) {
      console.log("Error: ?", err);
      res.sendStatus(500); // If any error occurs, it is probably not the client's fault
    } else {
      if(rows.affectedRows == 0) {
        res.sendStatus(404); // Can't delete nonexistent items
      } else {
       res.send('');
      }
   }
  });
});

app.delete("/transaction" , function(req, res) {
  connectionPool.query(mysql.format("TRUNCATE ??.transaction", databaseName), function(err,rows,fields) {
    if(err) {
      console.log("Error: ?", err);
      res.sendStatus(500); // If any error occurs, it is probably not the client's fault
    } else {
      res.send('');
    }
 });
});
 
app.post("/transaction/:itemId" , function(req,res) {
  var itemId = req.params.itemId;
  connectionPool.query(mysql.format("INSERT INTO ??.transaction value(?)", [databaseName, itemId]), function(err,rows,field) {
    if(err) {
      console.log("Error: ?",err);
      if(err.code == 'ER_NO_REFERENCED_ROW_2'){
         res.status(400).send('Invalid Item ID');
      } else {
         res.sendStatus(500); // If any OTHER error occurs, it is probably not the client's fault
      }
    } else {
      res.send('');
    }
  });
});

app.listen(port);
