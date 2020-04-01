require('dotenv').config();

const express = require('express');
const NodeCache = require('node-cache');
const cors = require('cors');
const axios = require('axios');
const moment = require('moment');
const url = require('url');

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

        res.status(404);
        return res.send('Unknow error');
    }
});

app.listen(process.env.PORT || 3004);