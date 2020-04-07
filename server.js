require('dotenv').config();

const express = require('express');
const NodeCache = require('node-cache');
const cors = require('cors');
const axios = require('axios');
const moment = require('moment');
const url = require('url');
const nodemailer = require("nodemailer");

const app = express();
app.use(express.json());
app.use(cors());

// const routes = express.Router();
const cache = new NodeCache();

app.get('/latest', async (req, res) => {
    try {
        const key = `latest?${url.parse(req.originalUrl).query}`;
        let data = cache.get(key);

        if (data != undefined) {
            return res.json(data);
        } else {
            let { data, status, statusText } = await axios.get(`${process.env.EXCHANGE_URL}${key}`);

            if (status == 200) {
                let nextUpdate = moment.utc();
                let now = moment.utc();

                nextUpdate.hour(15).minute(0).second(0).millisecond(0);
                if (now.isAfter(nextUpdate)) {
                    nextUpdate.add(1, 'd');
                }

                const ttl = Math.floor((nextUpdate.valueOf() - now.valueOf()) / 1000);

                cache.set(key, data, ttl);

                return res.json(data);
            } else {
                res.status(status);
                return res.send(statusText);
            }
        }
    } catch (error) {
        console.error(error);

        res.status(500);
        return res.send();
    }
});


app.post('/sendmail', async (req, res) => {
    try {
        const { from = email, name, phone, message } = req.body;
        const { host, port, secure, user, pass } = JSON.parse(process.env.MAIL_INFO);

        const transporter = nodemailer.createTransport({
            host, port, secure,
            auth: {
                user, pass
            }
        });

        await transporter.sendMail({
            from,
            to: user,
            subject: 'New Message from Contact Form',
            text: `Name: ${name} \n Email: ${from} \n Phone: ${phone} \n Message: ${message} `
        }, (error, info) => {
            if (error) {
                res.sendStatus(403);
                res.json(error);
            } else {
                res.sendStatus(200);
                res.send();
            }
        });
    } catch (error) {
        console.error(error);

        res.status(500);
        return res.send();
    }
});

app.listen(process.env.PORT || 3004);