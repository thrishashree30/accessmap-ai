import "dotenv/config";
import axios from "axios";
import fs from "fs";

const tokenUrl =
  "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";

const processUrl =
  "https://sh.dataspace.copernicus.eu/process/v1";

async function getAccessToken() {
  const response = await axios.post(
    tokenUrl,
    new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.SENTINEL_CLIENT_ID,
      client_secret: process.env.SENTINEL_CLIENT_SECRET,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data.access_token;
}

async function getSatelliteImage() {
  try {
    console.log("🛰️ Getting Sentinel-2 access token...");

    const token = await getAccessToken();

    console.log("✅ Authentication successful!");
    console.log("🛰️ Requesting Sentinel-2 image...");

    const requestBody = {
      input: {
        bounds: {
          bbox: [
            80.137399,
            13.351875,
            80.147399,
            13.361875,
          ],
          properties: {
            crs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
          },
        },

        data: [
          {
            type: "sentinel-2-l2a",

            dataFilter: {
              timeRange: {
  from: "2026-06-28T00:00:00Z",
  to: "2026-07-28T23:59:59Z",
},

              mosaickingOrder: "leastCC",
            },
          },
        ],
      },

      output: {
        width: 1024,
        height: 1024,

        responses: [
          {
            identifier: "default",

            format: {
              type: "image/jpeg",
            },
          },
        ],
      },

      evalscript: `
        //VERSION=3

        function setup() {
          return {
            input: ["B02", "B03", "B04"],
            output: {
              bands: 3
            }
          };
        }

        function evaluatePixel(sample) {
          return [
            2.5 * sample.B04,
            2.5 * sample.B03,
            2.5 * sample.B02
          ];
        }
      `,
    };

    const response = await axios.post(
      processUrl,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "image/jpeg",
        },

        responseType: "arraybuffer",
      }
    );

    fs.writeFileSync(
      "./server/sentinel-campus-before.jpg",
      response.data
    );

    console.log("✅ Sentinel-2 image downloaded!");
    console.log("📁 Saved as: server/sentinel-campus-before.jpg");

  } catch (error) {
    console.error("❌ Sentinel-2 request failed.");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error(
        "Message:",
        Buffer.from(error.response.data).toString()
      );
    } else {
      console.error(error.message);
    }
  }
}

getSatelliteImage();