require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

mongoose.connect(process.env.db_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const UrlSchema = new mongoose.Schema({
    source: String
})

const Url = mongoose.model('Url', UrlSchema);

app.post('/api/shorturl', function(req, res) {
    let url = req.body.url;

    dns.lookup(url, (err) => {
        const httpRegex = /^(http|https)(:\/\/)/;
        if (!err || err.code != "ENOTFOUND" || !httpRegex.test(url)) {
            res.json({
                error: "invalid url"
            });
        }
        else {
            Url.findOne({source: url}, (err, data) => {
                if (err) return console.log(err);
                if (data) {
                    res.json({
                        original_url: data.source,
                        short_url: data._id
                    })
                }
                else {
                    let newUrl = new Url({source: url});
                    newUrl.save((err, data) => {
                        if (err) return console.log(err);
                        res.json({
                            original_url: url,
                            short_url: data._id
                        })
                    })
                }
            });
        }
    });
    
});

app.get("/api/shorturl/:id?", (req, res) => {
    let id = req.params.id;
    Url.findOne({_id: id}, (err, data) => {
        if (err) return console.log(err);
        if (data) {
            res.redirect(data.source);
        }
        else {
            res.json({
                id: "not exist"
            })
        }
    })
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
