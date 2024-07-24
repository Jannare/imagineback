// routes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const pool = require('./db');
const { getAllMedia } = require('./google-photos');

let token = ""; // Initialize the token variable

// Fetch OAuth credentials from the database
async function getOAuthCredentials() {
    const [rows] = await pool.query('SELECT client_id, client_secret, redirect_uri FROM oauth_credentials LIMIT 1');
    return rows[0];
}

// Route to start the login process
router.get('/', async (req, res) => {
    const credentials = await getOAuthCredentials();

    let url = 'https://accounts.google.com/o/oauth2/v2/auth';
    url += `?client_id=${credentials.client_id}`;
    url += `&redirect_uri=${credentials.redirect_uri}`;
    url += '&response_type=code';
    // Add Google Photos API scope
    url += '&scope=email profile https://www.googleapis.com/auth/photoslibrary.readonly openid';
    url += '&access_type=online';
    res.redirect(url);
});

// Route to handle the redirect from Google OAuth
router.get('/redirect', async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.status(400).send('Code not found');
    }

    try {
        const credentials = await getOAuthCredentials();

        // Exchange code for access token
        const response = await axios.post('https://oauth2.googleapis.com/token', null, {
            params: {
                code,
                client_id: credentials.client_id,
                client_secret: credentials.client_secret,
                redirect_uri: credentials.redirect_uri,
                grant_type: 'authorization_code',
            },
        });

        const { access_token } = response.data;

        // Use access token to get user info
        const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        const userInfo = userInfoResponse.data;
        const { id, name, email } = userInfo;

        console.log('User Info:', userInfo);
        console.log("access_token:", access_token);
        token = access_token;
        console.log("token:", token);

        // Insert user info and access token into the database
        // await pool.query(
        //     'INSERT INTO users (google_id, name, email, access_token) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=?, email=?, access_token=?',
        //     [id, name, email, access_token, name, email, access_token]
        // );

        // Send user info and access token as JSON response
        res.json({ id, name, email, access_token });
    } catch (error) {
        console.error('Error during OAuth process', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// Route to fetch Google Photos
router.get('/photos', async (req, res) => {
    try {
        console.log('Fetching photos using access token:', token);
        const data = await getAllMedia(token);
        res.json(data);
    } catch (error) {
        console.error('Error fetching photos:', error);
        res.status(500).json({ error: 'Failed to fetch photos' });
    }
});

module.exports = router;


// const express = require('express');
// const router = express.Router();
// const axios = require('axios');
// const pool = require('./db');
// const {getAllMedia} = require('./google-photos');
// const token = "";
// // Fetch OAuth credentials from the database
// async function getOAuthCredentials() {
//     const [rows] = await pool.query('SELECT client_id, client_secret, redirect_uri FROM oauth_credentials LIMIT 1');
//     return rows[0];
// }

// // Route to start the login process
// router.get('/', async (req, res) => {
//     const credentials = await getOAuthCredentials();

//     let url = 'https://accounts.google.com/o/oauth2/v2/auth';
//     url += `?client_id=${credentials.client_id}`;
//     url += `&redirect_uri=${credentials.redirect_uri}`;
//     url += '&response_type=code';
//     // Add Google Photos API scope
//     url += '&scope=email profile https://www.googleapis.com/auth/photoslibrary.readonly openid';
//     url += '&access_type=online';
//     res.redirect(url);
// });

// // Route to handle the redirect from Google OAuth
// router.get('/redirect', async (req, res) => {
//     const { code } = req.query;
//     if (!code) {
//         return res.status(400).send('Code not found');
//     }

//     try {
//         const credentials = await getOAuthCredentials();

//         // Exchange code for access token
//         const response = await axios.post('https://oauth2.googleapis.com/token', null, {
//             params: {
//                 code,
//                 client_id: credentials.client_id,
//                 client_secret: credentials.client_secret,
//                 redirect_uri: credentials.redirect_uri,
//                 grant_type: 'authorization_code',
//             },
//         });

//         const { access_token } = response.data;

//         // Use access token to get user info
//         const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
//             headers: {
//                 Authorization: `Bearer ${access_token}`,
//             },
//         });

//         const userInfo = userInfoResponse.data;
//         const { id, name, email } = userInfo;

//         console.log('User Info:', userInfo);
//         console.log("access_token:", access_token);
//         token = access_token;
//         console.log("token:", token)

//         // Insert user info and access token into the database
//         await pool.query(
//             'INSERT INTO users (google_id, name, email, access_token) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=?, email=?, access_token=?',
//             [id, name, email, access_token, name, email, access_token]
//         );

//         // Send user info and access token as JSON response
//         res.json({ id, name, email, access_token });
//     } catch (error) {
//         console.error('Error during OAuth process', error);
//         res.status(500).json({ error: 'Authentication failed' });
//     }
// });

// async function handler(req, method) {
//     if (method == "GET") {
//         if (req.url = "/test-2") {
//             const access_token = token
//             const data = await getAllMedia(access_token);
//             return JSON.stringify(data);
//         }
//     }
// }

// // // Route to fetch Google Photos
// // router.post('/photos', async (req, res) => {
// //     const { id } = req.body;  // Assume we receive the user ID in the request body
// //     console.log(`Fetching photos for user ID: ${id}`);

// //     if (!id) {
// //         return res.status(400).send('User ID not provided');
// //     }

// //     try {
// //         // Fetch the access token from the database using the user ID
// //         const [rows] = await pool.query('SELECT access_token FROM users WHERE google_id = ?', [id]);

// //         if (rows.length === 0) {
// //             return res.status(400).send('User not found');
// //         }

// //         const dbAccessToken = rows[0].access_token;

// //         // Use the access token to call the Google Photos API
// //         const photosResponse = await axios.get('https://photoslibrary.googleapis.com/v1/mediaItems', {
// //             headers: {
// //                 Authorization: `Bearer ${dbAccessToken}`,
// //             },
// //         });

// //         const photos = photosResponse.data.mediaItems;
// //         res.json(photos);
// //     } catch (error) {
// //         console.error('Error fetching photos', error.response ? error.response.data : error.message);
// //         res.status(500).json({ error: 'Failed to fetch photos' });
// //     }
// // });

// module.exports = router;
