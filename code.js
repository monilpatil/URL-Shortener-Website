const express = require('express')
const mysql = require('mysql2')
require("dotenv").config();
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.static("public"));
app.use(express.json());

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: process.env.psw_db,
  database: process.env.db_name,
})

con.connect(function (error) {
  if (error) {
    console.log("Database connection failed", error)
  } else {
    console.log("Database connected")
  }
})

app.get("/", function (req, resp) {
  resp.sendFile(__dirname + "/public/index.html")
})

app.post("/api/create-short-url", function (req, resp) {
  let uniqueID = Math.random().toString(36).replace(/[^a-z0-9]/gi, '').substr(2, 10)
  let sql = `INSERT INTO links(longurl,shorturlid) VALUES('${req.body.longurl}','${uniqueID}')`
  con.query(sql, function (error, result) {
    if (error) {
      resp.status(500).json({
        status: "notok",
        message: "Somthing went wrong"
      })
    } else {
      resp.status(200).json({
        status: "ok",
        shorturlid: uniqueID
      })
    }
  })
})

app.get("/api/get-all-short-urls", function (req, resp) {
  const sql = `SELECT * FROM links`;
  con.query(sql, function (err, result) {
    if (err) {
      resp.status(500).json({
        status: "notok",
        message: "Somthing went wrong!!!"
      })
    } else {
      resp.status(200).json(result)
    }
  })
})

app.get("/:shorturlid", function (req, resp) {
  let shorturlid = req.params.shorturlid;
  let selectSql = "SELECT * FROM links WHERE shorturlid=? LIMIT 1";

  con.query(selectSql, [shorturlid], function (err, result) {
    if (err) {
      resp.status(500).json({
        status: "notok",
        message: "Something went wrong!!!"
      });
    } else {
      if (result.length > 0) {
        let updateSql = "UPDATE links SET count=? WHERE id=? LIMIT 1";
        let newCount = result[0].count ? result[0].count + 1 : 1; // Check if count exists

        con.query(updateSql, [newCount, result[0].id], function (error, result2) {
          if (error) {
            resp.status(500).json({
              status: "notok",
              message: "Something went wrong with the count update"
            });
          } else {
            resp.redirect(result[0].longurl);
          }
        });
      } else {
        resp.status(404).json({
          status: "notok",
          message: "Short URL not found"
        });
      }
    }
  });
});

app.listen(3000)