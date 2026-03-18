const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for Google Sheets
app.use(cors());
app.use(express.json());

// Endpoint to fetch product listings by ID
app.get('/api/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const conditionMap = {
      NM: "Near Mint",
      LP: "Lightly Played",
      MP: "Moderately Played",
      HP: "Heavily Played",
      DMG: "Damaged"
    };
    const conditions = req.query.condition
      ? [].concat(req.query.condition).map(c => conditionMap[c.toUpperCase()] ?? c)
      : ["Near Mint"];

    const response = await axios.post(
      `https://mp-search-api.tcgplayer.com/v1/product/${productId}/listings`,
      {
        filters: {
          term: {
            sellerStatus: "Live",
            "verified-seller": true,
            channelId: 0,
            language: ["English"],
            listingType: ["standard"],
            condition: conditions
          },
          range: {
            quantity: {
              gte: 1
            }
          },
          exclude: {
            channelExclusion: 0
          }
        },
        from: 0,
        size: 10,
        sort: {
          field: "price+shipping",
          order: "asc"
        },
        context: {
          shippingCountry: "US",
          cart: {}
        },
        aggregations: ["listingType"]
      },
      {
        headers: {
          'content-type': 'application/json',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching product:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch product data',
      message: error.message
    });
  }
});

// Endpoint to fetch latest sales by ID
app.get('/api/product/:productId/sales', async (req, res) => {
  try {
    const { productId } = req.params;

    const response = await axios.post(
      `https://mpapi.tcgplayer.com/v2/product/${productId}/latestsales`,
      {
        conditions: [1],
        languages: [1],
        variants: [],
        listingType: "ListingWithoutPhotos",
        limit: 5
      },
      {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching sales:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch sales data',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});