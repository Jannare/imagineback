const axios = require("axios");

function getAllMedia(access_token, pageToken, pageSize = 2) {
    let finalSet = [];
    return new Promise((resolve, reject) => {
        const params = {
            pageSize: pageSize,
            pageToken: pageToken,
        };
        const axioConfig = {
            method: "get",
            url: "https://photoslibrary.googleapis.com/v1/mediaItems",
            headers: {
                authorization: "Bearer " + access_token,
                "Content-Type": "application/json",
            },
            params: params,
        };
        axios(axioConfig)
            .then((response) => {
                console.log('API Response:', response.data); // Add this line to log the response
                const nextPageToken = response.data.nextPageToken;
                const mediaItems = response.data.mediaItems || []; // Add default empty array if mediaItems is undefined
                if (Array.isArray(mediaItems)) {
                    mediaItems.forEach((item) => {
                        finalSet.push(item.baseUrl);
                    });
                } else {
                    console.warn('Expected mediaItems to be an array, but got:', mediaItems);
                }
                if (nextPageToken) {
                    getAllMedia(access_token, nextPageToken).then((data) => {
                        finalSet = finalSet.concat(data);
                        resolve(finalSet);
                    }).catch(reject);
                } else {
                    resolve(finalSet);
                }
            })
            .catch((error) => {
                console.error('Error in getAllMedia:', error.response ? error.response.data : error.message);
                reject(error);
            });
    });
}

module.exports = {
    getAllMedia,
};
