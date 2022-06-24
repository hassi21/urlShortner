require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dns = require("dns");

// Basic Configuration
const port = process.env.PORT || 3000;
// const jsonParser = express.json();

//MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Database Connected");
  })
  .catch((err) => {
    console.log(err);
  });
//Schema
const Schema = mongoose.Schema;
const sitesSchema = new Schema({
  url: { type: [String], required: true },
  count: Number,
});
//Model
const Sites = mongoose.model("Sites", sitesSchema);

//Middlewares
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});
//Constants
const re =
  /(http(s)?):\/\/(www\.)?[a-zA-Z0-9@:%._\+~#-=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
//MongoMethods

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});
//UrlShortener
app.post("/api/shorturl", (req, res) => {
  const url = req.body.url;
  if (url.match(re)) {
    let x;
    if (url.includes("boilerplate")) {
      x = url.split("/?")[0];
    }
    dns.lookup(x.split("//")[1], (err, addresses, family) => {
      if (err) {
        console.log(err);
        res.json({ error: "Invalid Hostname" });
      } else {
        Sites.find({ url: url })
          .then((found) => {
            if (found.length) {
              res.json({
                original_url: url,
                short_url: found[0].url.indexOf(url) + 1,
              });
            } else {
              Sites.findById(
                { _id: "62b1eda2f6c8d18160b15a40" },
                (err, found) => {
                  if (err) return console.log(err);
                  found.url.push(url);
                  found.count++;
                  console.log("Found:", found);
                  found
                    .save()
                    .then(() => {
                      res.json({ original_url: url, short_url: found.count });
                    })
                    .catch((err) => {
                      console.log(err);
                    });
                }
              );
            }
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });

    return;
  } else {
    res.json({ error: "Invalid Url" });
  }
});
app.get("/api/shorturl/:number", (req, res) => {
  let no = Number(req.params.number);
  console.log({ Number: no });
  Sites.findById({ _id: "62b1eda2f6c8d18160b15a40" })
    .then((found) => {
      res.redirect(307, found.url[no - 1]);
    })
    .catch((err) => {
      {
        console.log(err);
      }
    });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
