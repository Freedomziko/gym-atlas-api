require('dotenv').config();

const { findPlaceId, fetchPlaceHours } = require('../services/placesService');
const pool = require('../db');

const gyms = [
  { id: 1, name: "PureGym Glasgow Charing Cross", lat: 55.8685933, lng: -4.2708698 },
  { id: 2, name: "PureGym Edinburgh City Centre", lat: 55.9533, lng: -3.1883 },
  { id: 3, name: "JD Gyms Glasgow South", lat: 55.842514, lng: -4.2542328 },
  { id: 4, name: "The Gym Group Edinburgh Meadowbank", lat: 55.9519, lng: -3.16 },
  { id: 5, name: "Nuffield Health Glasgow Central", lat: 55.8609, lng: -4.2514 },
  { id: 6, name: "Prestige Fitness Glasgow", lat: 55.8539, lng: -4.2918 },
  { id: 7, name: "Summit Fitness Edinburgh", lat: 55.9646, lng: -3.1948 },
  { id: 8, name: "MuscleHut Glasgow", lat: 55.8504, lng: -4.3562 },
  { id: 13, name: "The Gym Group Glasgow South", lat: 55.8372869, lng: -4.2565387 },
  { id: 15, name: "PureGym Aberdeen Kittybrewster", lat: 57.161597, lng: -2.109782 },
  { id: 17, name: "PureGym Aberdeen Shiprow", lat: 57.146192, lng: -2.095058 },
  { id: 18, name: "PureGym Aberdeen Rubislaw", lat: 57.140902, lng: -2.148955 },
  { id: 19, name: "PureGym Aberdeen Wellington Circle", lat: 57.110318, lng: -2.092725 },
  { id: 20, name: "PureGym Glasgow Bath Street", lat: 55.86439, lng: -4.25995 },
  { id: 21, name: "PureGym Glasgow Hope Street", lat: 55.85991, lng: -4.25938 },
  { id: 27, name: "PureGym London Greenwich", lat: 51.47607, lng: -0.01795 },
  { id: 29, name: "Streatham Ice and Leisure Centre", lat: 51.42384, lng: -0.13118 },
  { id: 30, name: "OmniGym Glasgow", lat: 55.841641, lng: -4.223324 },
  { id: 33, name: "The Gym Group Glasgow City", lat: 55.858001, lng: -4.256247 },
  { id: 34, name: "PureGym Dundee", lat: 56.46086, lng: -2.97836 },
  { id: 35, name: "The Gym Group Dundee", lat: 56.473915, lng: -3.005042 },
  { id: 36, name: "JD Gyms Dundee", lat: 56.463947, lng: -2.969431 },
  { id: 37, name: "The Gym Dock", lat: 54.42212, lng: -5.914826 },
  { id: 38, name: "JP's Gym", lat: 55.85374, lng: -4.0243 },
  { id: 39, name: "EP gym", lat: 52.055757, lng: -1.326495 },
  { id: 40, name: "Be Modified Gym & Fitness", lat: 52.969344, lng: -1.465995 },
  { id: 41, name: "Future Fitness Glasgow", lat: 55.82921, lng: -4.28321 },
  { id: 42, name: "UltraFlex Durham", lat: 54.790067, lng: -1.535532 },
  { id: 43, name: "PureGym Edinburgh Exchange Crescent", lat: 55.947162, lng: -3.2091124 },
  { id: 44, name: "Ultraflex Rotherham", lat: 53.43816, lng: -1.35277 },
  { id: 45, name: "Everlast Gyms - Glasgow Fort", lat: 55.8683, lng: -4.12802 },
  { id: 46, name: "Everlast Gyms - Glasgow Fort", lat: 55.8683, lng: -4.12802 },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  for (const gym of gyms) {
    const { id, name, lat, lng } = gym;

    const placeId = await findPlaceId(name, lat, lng);
    if (!placeId) {
      console.log(`[SKIP] ${name}`);
      await sleep(200);
      continue;
    }

    const hours = await fetchPlaceHours(placeId);
    if (!hours) {
      console.log(`[NO HOURS] ${name}`);
      await sleep(200);
      continue;
    }

    await pool.query(
      'UPDATE gyms SET opening_hours = $1, hours_updated_at = NOW() WHERE id = $2',
      [JSON.stringify(hours), id]
    );
    console.log(`[OK] ${name}`);

    await sleep(200);
  }

  await pool.end();
};

run().catch((err) => {
  console.error('Backfill failed:', err);
  pool.end();
  process.exit(1);
});
