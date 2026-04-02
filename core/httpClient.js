import axios from "axios";
import { ResponseDTO } from "../dto/responseDto.js";

import logger from "../utils/logger.js";
import { buildValidatedUrl } from "../utils/urlValidator.js";

// import https from "https";

// const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export const postData = async (url, requestDto) => {
  let response;
  try {

    const responseFromService = await axios.post(buildValidatedUrl(url), requestDto);

    // Deserialize JSON response into ResponseDTO object
    const responseData = responseFromService.data;
    response = new ResponseDTO(
      responseData.success,
      responseData.message,
      responseData.result
    );
  } catch (error) {
    // Handle errors here
    logger.error("An error occurred:", { error });
    throw error;
  }

  return response;
};

export const getData = async (url) => {
  try {
    let responseFromService;

    
    responseFromService = await axios.get(buildValidatedUrl(url));

    return responseFromService;
  } catch (error) {
    throw error; // Optionally rethrow the error if needed
  }
};

const HOLDERRESTYPE = process.env.HOLDERRESTYPE || "text"; // Default to "text"
const HOLDERRESPARAM = process.env.HOLDERRESPARAM || "holderSeed";

export async function createRequest(uri, requestBody, method) {
  let options = {
    method,
  };

  if (method !== "GET") {
    options.headers = {
      "Content-Type": "application/json",
    };
    options.body = JSON.stringify(requestBody);
  }
  try {

    const response = await fetch(buildValidatedUrl(uri), options);

    if (!response.ok) {
      logger.info(`HTTP error! Status: ${response.status}`);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    if (HOLDERRESTYPE === "json") {
      const data = await response.json();
      return data[HOLDERRESPARAM] ?? data; // Return the required param if available
    } else {
      return await response.text(); // Return raw text if HOLDERRESTYPE is "text"
    }
  } catch (error) {
    logger.info("Error in Data fetching from url");
    throw new Error("Error in Data fetching from url");
  }
}
