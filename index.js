const express = require('express');
require('dotenv').config();
const connectDB = require('./config/db');
const port = process.env.PORT || 8080;
const Search = require('./models/searchModel');
const { mongoose } = require('mongoose');
const errorHandler = require('./middleware/errorMiddleware');

connectDB();

const app = express();
app.use(express.json());

app.get('/hello', (req, res) => {
  res.status(200).send();
});

app.post('/lastSearch', async (req, res, next) => {
  const { userId, searchPhrase } = req.body;
  if (!userId || !searchPhrase) {
    return res.status(400).send();
  }
  try {
    await Search.create({ userId, searchPhrase });
    res.status(201).send();
  } catch (error) {
    next(error);
  }
});

app.get('/health', async (req, res, next) => {
  try {
    await mongoose.connection.db.command({ ping: 1 });
    res.status(200).send();
  } catch (error) {
    next(error);
  }
});

app.get('/lastSearches', async (req, res, next) => {
  try {
    const { userId, limit } = req.query;
    if (!userId || !limit || isNaN(limit)) {
      return res.status(400).send('Invalid parameters');
    }

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const searches = await Search.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: twoWeeksAgo },
        },
      },
      {
        $group: {
          _id: '$searchPhrase',
          latestTimestamp: { $max: '$timestamp' },
        },
      },
      {
        $sort: {
          latestTimestamp: 1,
        },
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    if (searches.length === 0) {
      return res.status(404).send('No searches found for the user');
    }

    const lastSearches = searches.map((search) => search._id);

    res.status(200).json({ lastSearches });
  } catch (error) {
    next(error);
  }
});

app.get('/mostPopular', async (req, res, next) => {
  try {
    const { limit } = req.query;

    if (!limit || isNaN(limit)) {
      return res.status(400).send('Invalid parameters');
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const popularSearches = await Search.aggregate([
      {
        $match: {
          timestamp: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: '$searchPhrase',
          hits: { $sum: 1 },
        },
      },
      {
        $sort: { hits: -1 },
      },
      {
        $limit: parseInt(limit),
      },
      {
        $project: {
          _id: 0,
          searchPhrase: '$_id',
          hits: '$hits',
        },
      },
    ]);

    if (popularSearches.length === 0) {
      return res.status(404).send('No popular searches found');
    }

    res.status(200).json({ mostSearched: popularSearches });
  } catch (error) {
    next(error);
  }
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
